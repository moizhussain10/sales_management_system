<?php
include 'db.php';

requireAuth(['admin', 'ba']);

echo json_encode(array(
    'status' => 'success',
    'user' => $_SESSION['user'],
    'csrf_token' => $_SESSION['csrf_token']
));