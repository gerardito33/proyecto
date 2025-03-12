from django.db import models

class Conductor(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    licencia = models.CharField(max_length=50, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    fecha_contratacion = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class Camion(models.Model):
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    placa = models.CharField(max_length=20, unique=True)
    capacidad = models.FloatField()
    año = models.IntegerField()
    informacion_adicional = models.TextField(blank=True, null=True)
    conductor = models.ForeignKey(Conductor, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.placa})"

class Cliente(models.Model):
    nombre = models.CharField(max_length=255)
    empresa = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Pedido(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("en_proceso", "En proceso"),
        ("completado", "Completado"),
        ("cancelado", "Cancelado"),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="pedidos")
    camion = models.ForeignKey(Camion, on_delete=models.SET_NULL, null=True, blank=True)
    conductor = models.ForeignKey(Conductor, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_entrega = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Pedido {self.id} - {self.estado}"

# Gestión de Gastos para Camiones
class GastoCamion(models.Model):
    TIPOS_GASTO = [
        ("combustible", "Combustible"),
        ("reparacion", "Reparación"),
        ("filtros", "Filtros"),
        ("seguro", "Seguro"),
        ("otros", "Otros"),
    ]

    camion = models.ForeignKey(Camion, on_delete=models.CASCADE, related_name="gastos")
    tipo_gasto = models.CharField(max_length=20, choices=TIPOS_GASTO)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateField()
    comentarios = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_tipo_gasto_display()} - ${self.monto} ({self.camion})"

# Gestión de Sueldos de Empleados
class SueldoEmpleado(models.Model):
    METODO_PAGO = [
        ("efectivo", "Efectivo"),
        ("transferencia", "Transferencia Bancaria"),
        ("cheque", "Cheque"),
    ]

    empleado = models.ForeignKey(Conductor, on_delete=models.CASCADE, related_name="sueldos")
    periodo_sueldo = models.CharField(max_length=20, blank=True, null=True)
    salario_base = models.DecimalField(max_digits=10, decimal_places=2)
    bonos = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    deducciones = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    horas_extras = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    adelanto = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_neto = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    fecha_pago = models.DateField()
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO, default="transferencia")

    def save(self, *args, **kwargs):
        """Calcula el total neto antes de guardar"""
        self.total_neto = (self.salario_base + self.bonos + self.horas_extras) - (self.deducciones + self.adelanto)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sueldo {self.empleado.nombre} {self.empleado.apellido} - ${self.total_neto} ({self.fecha_pago})"

# Módulo de Rastreo GPS
class Ubicacion(models.Model):
    camion = models.ForeignKey(Camion, on_delete=models.CASCADE, related_name="ubicaciones")
    latitud = models.FloatField()  # Latitud de la ubicación
    longitud = models.FloatField()  # Longitud de la ubicación
    timestamp = models.DateTimeField(auto_now_add=True)  # Fecha y hora de la ubicación

    def __str__(self):
        return f"{self.camion.placa} - ({self.latitud}, {self.longitud})"

# Módulo de Facturación
class Factura(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="facturas")
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True, related_name="facturas")
    fecha = models.DateField()  # Campo de fecha
    servicio = models.CharField(max_length=100)  # Servicio
    origen = models.CharField(max_length=100)  # Origen
    destino = models.CharField(max_length=100)  # Destino
    horas_espera = models.FloatField()  # Horas de espera
    precio_hora = models.DecimalField(max_digits=10, decimal_places=2)  # Precio por hora ($H)
    peajes = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Peajes
    importe_lista = models.DecimalField(max_digits=10, decimal_places=2)  # Importe de lista

    # Campos calculados (opcional, si no necesitas almacenarlos en la base de datos)
    @property
    def final_h(self):
        """Calcula el costo final por horas de espera."""
        return self.horas_espera * self.precio_hora  # $Final H

    @property
    def importe_total(self):
        """Calcula el importe total de la factura."""
        return self.final_h + self.peajes + self.importe_lista  # Importe Total

    def __str__(self):
        return f"Factura {self.id} - {self.servicio}"

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"