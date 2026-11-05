<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

requireAuth(['admin', 'ba']);

try {
    $conn->exec(
        "CREATE TABLE IF NOT EXISTS ba_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ba_id INT NOT NULL,
            attendance_date DATE NOT NULL,
            status ENUM('present', 'absent', 'day_off') NOT NULL DEFAULT 'present',
            note VARCHAR(255) NULL,
            marked_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_ba_day (ba_id, attendance_date)
        )"
    );
} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => "Unable to initialize attendance table: " . apiExceptionMessage($e)));
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), false);
if (!is_object($data)) {
    $data = (object) [];
}

if ($method === 'GET') {
    $date = isset($_GET['date']) ? $_GET['date'] : null;
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    $baId = isset($_GET['ba_id']) ? intval($_GET['ba_id']) : null;
    if (($_SESSION['user']['role'] ?? '') === 'ba') {
        $sessionBaId = intval($_SESSION['user']['id']);
        if ($baId !== null && $baId !== $sessionBaId) {
            http_response_code(403);
            echo json_encode(array("status" => "error", "message" => "You cannot view another BA's attendance."));
            exit;
        }
        $baId = $sessionBaId;
    }
    $hasDateRange = $startDate !== null || $endDate !== null;

    if ($hasDateRange) {
        $startDateObject = $startDate ? DateTimeImmutable::createFromFormat('!Y-m-d', $startDate) : false;
        $endDateObject = $endDate ? DateTimeImmutable::createFromFormat('!Y-m-d', $endDate) : false;

        if (
            !$startDateObject || !$endDateObject ||
            $startDateObject->format('Y-m-d') !== $startDate ||
            $endDateObject->format('Y-m-d') !== $endDate ||
            $startDateObject > $endDateObject
        ) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "A valid start_date and end_date are required."));
            exit;
        }

        if ((int) $startDateObject->diff($endDateObject)->format('%a') > 365) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "Attendance reports are limited to 366 days per request."));
            exit;
        }
    }

    try {
        $sql = "
            SELECT a.*, u.name AS ba_name, u.username AS ba_username
            FROM ba_attendance a
            LEFT JOIN users u ON u.id = a.ba_id
            WHERE 1 = 1";
        $params = [];

        if ($startDate && $endDate) {
            $sql .= " AND a.attendance_date BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $startDate;
            $params[':end_date'] = $endDate;
        } else {
            $date = $date ?: date('Y-m-d');
            $sql .= " AND a.attendance_date = :date";
            $params[':date'] = $date;
        }

        if ($baId) {
            $sql .= " AND a.ba_id = :ba_id";
            $params[':ba_id'] = $baId;
        }

        $sql .= " ORDER BY a.attendance_date DESC, u.name ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($hasDateRange) {
            $baSql = "SELECT id, name, username FROM users WHERE LOWER(role) = 'ba'";
            $baParams = [];
            if ($baId) {
                $baSql .= " AND id = :ba_id";
                $baParams[':ba_id'] = $baId;
            }
            $baSql .= " ORDER BY name ASC";
            $baStmt = $conn->prepare($baSql);
            $baStmt->execute($baParams);
            $baUsers = $baStmt->fetchAll(PDO::FETCH_ASSOC);
            $attendanceByBa = [];

            foreach ($attendance as $item) {
                $attendanceByBa[$item['attendance_date'] . ':' . (int) $item['ba_id']] = true;
            }

            $defaultRows = [];
            $datePeriod = new DatePeriod(
                $startDateObject,
                new DateInterval('P1D'),
                $endDateObject->modify('+1 day')
            );

            foreach ($datePeriod as $attendanceDay) {
                $attendanceDate = $attendanceDay->format('Y-m-d');
                foreach ($baUsers as $user) {
                    $currentBaId = (int) $user['id'];
                    if (isset($attendanceByBa[$attendanceDate . ':' . $currentBaId])) {
                        continue;
                    }

                    $defaultRows[] = [
                        'id' => null,
                        'ba_id' => $currentBaId,
                        'attendance_date' => $attendanceDate,
                        'status' => 'absent',
                        'note' => 'Auto-marked absent until check-in',
                        'marked_by' => null,
                        'created_at' => null,
                        'updated_at' => null,
                        'ba_name' => $user['name'],
                        'ba_username' => $user['username'],
                    ];
                }
            }

            $attendance = array_values(array_merge($attendance, $defaultRows));
            usort($attendance, function ($left, $right) {
                $dateOrder = strcmp($right['attendance_date'], $left['attendance_date']);
                return $dateOrder !== 0 ? $dateOrder : strcasecmp($left['ba_name'], $right['ba_name']);
            });
        } else {
            $date = $date ?: date('Y-m-d');
            $baStmt = $conn->prepare("SELECT id, name, username FROM users WHERE LOWER(role) = 'ba' ORDER BY name ASC");
            $baStmt->execute();
            $baUsers = $baStmt->fetchAll(PDO::FETCH_ASSOC);
            $attendanceByBa = [];

            foreach ($attendance as $item) {
                $attendanceByBa[(int) $item['ba_id']] = $item;
            }

            $defaultRows = [];
            foreach ($baUsers as $user) {
                $currentBaId = (int) $user['id'];
                if ($baId && $baId !== $currentBaId) {
                    continue;
                }
                if (isset($attendanceByBa[$currentBaId])) {
                    continue;
                }

                $defaultRows[] = [
                    'id' => null,
                    'ba_id' => $currentBaId,
                    'attendance_date' => $date,
                    'status' => 'absent',
                    'note' => 'Auto-marked absent until self-check-in',
                    'marked_by' => null,
                    'created_at' => null,
                    'updated_at' => null,
                    'ba_name' => $user['name'],
                    'ba_username' => $user['username'],
                ];
            }

            $attendance = array_values(array_merge($attendance, $defaultRows));
        }

        $summary = [
            'present' => 0,
            'absent' => 0,
            'day_off' => 0,
            'total' => count($attendance)
        ];

        foreach ($attendance as $entry) {
            $status = strtolower((string) ($entry['status'] ?? 'present'));
            if (isset($summary[$status])) {
                $summary[$status]++;
            }
        }

        echo json_encode(array(
            "status" => "success",
            "attendance" => $attendance,
            "summary" => $summary,
            "date" => $date,
            "start_date" => $startDate,
            "end_date" => $endDate
        ));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
    exit;
}

if ($method === 'POST') {
    $actorRole = $_SESSION['user']['role'] ?? '';
    $actorId = intval($_SESSION['user']['id']);
    $baId = $actorRole === 'admin'
        ? (isset($data->ba_id) ? intval($data->ba_id) : 0)
        : $actorId;
    $date = !empty($data->date) ? $data->date : date('Y-m-d');
    $status = isset($data->status) ? strtolower(trim($data->status)) : '';
    $note = isset($data->note) ? trim($data->note) : '';
    $markedBy = $actorId;

    $allowedStatuses = $actorRole === 'admin' ? ['present', 'absent', 'day_off'] : ['present', 'day_off'];
    if ($baId <= 0 || !in_array($status, $allowedStatuses, true)) {
        echo json_encode(array("status" => "error", "message" => "Invalid BA ID or attendance status."));
        exit;
    }

    try {
        $stmt = $conn->prepare(
            "INSERT INTO ba_attendance (ba_id, attendance_date, status, note, marked_by)
             VALUES (:ba_id, :date, :status, :note, :marked_by)
             ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                note = VALUES(note),
                marked_by = VALUES(marked_by),
                updated_at = NOW()"
        );

        $stmt->execute([
            ':ba_id' => $baId,
            ':date' => $date,
            ':status' => $status,
            ':note' => $note,
            ':marked_by' => $markedBy ?? $baId,
        ]);

        echo json_encode(array(
            "status" => "success",
            "message" => "Attendance updated successfully.",
            "status_value" => $status,
            "date" => $date
        ));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
    exit;
}

echo json_encode(array("status" => "error", "message" => "Unsupported request method."));
?>
