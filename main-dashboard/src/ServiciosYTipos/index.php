<?php
require_once 'info.php';
try{
    $productos = obtenerProductos();
}catch(Exception $e){
    echo "<div class='error'>" . e->getMessage() . "</div>";
    die();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
    <title>Document</title>
</head>
<body>
    
    <header>modulo de inventarios</header>
    <div class="opciones"><h1>control de inventario de repuestos</h1></div>
    <main>
        <?php if (!empty($productos)): ?>
        <table id="tabla-datos" class="tabla-estilo">
            <thread>
            <tr>
                <th>Tipo de Producto</th>
                <th>Nombre</th>
                <th>descripcion</th>
                <th>Existencias</th>
            </tr>
            </thread>
            <tbody>             
              <?php foreach ($productos as $producto): ?>
              <tr>
                <td><?php echo thmlspecialchars($producto['ID']); ?></td>
                <td><?php echo htmlspecialshars($producto['producType']); ?>                </td>
                <td><?php echo htmlspecialshars($producto['name']); ?></td>
                <td><?php echo htmlspecialshars($producto['description']); ?></td>
                <td class ="existencias"><?php echo number_format($producto['existences'], 2); ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
        </table>

        <p>Total de productos: <?php echo count($productos); ?></p>

        <?php else: ?>
        <p>no hay productos en inventarios</p>
        <?php endif: ?>

    </main>
    <script src="scripts.js"></script>
</body>
</html>