<?php
$pdo = new PDO('mysql:host=localhost;dbname=db_lns;charset=utf8mb4', 'root', '');

// Obtener todas las tablas
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($tables as $table) {
    echo "\n========================================\n";
    echo "TABLA: $table\n";
    echo "========================================\n\n";
    
    $stmt = $pdo->query("DESCRIBE `$table`");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("%-25s %-30s %-10s %-10s %-20s %-20s\n", 
            $row['Field'], 
            $row['Type'], 
            $row['Null'], 
            $row['Key'], 
            $row['Default'] ?? 'NULL',
            $row['Extra']
        );
    }
}


