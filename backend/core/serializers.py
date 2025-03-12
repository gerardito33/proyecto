from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Camion, Conductor, Cliente, Pedido, GastoCamion, SueldoEmpleado, Ubicacion, Factura
from decimal import Decimal  # Importar Decimal para manejar cálculos precisos

# 🔹 Serializador de Usuarios
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]

# 🔹 Serializador de Conductores
class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = ["id", "nombre", "apellido", "licencia", "telefono", "email", "fecha_contratacion"]

# 🔹 Serializador de Camiones
class CamionSerializer(serializers.ModelSerializer):
    conductor = ConductorSerializer(read_only=True)
    conductor_id = serializers.PrimaryKeyRelatedField(
        queryset=Conductor.objects.all(), source="conductor", write_only=True, required=False
    )

    class Meta:
        model = Camion
        fields = ["id", "marca", "modelo", "placa", "capacidad", "año", "informacion_adicional", "conductor", "conductor_id"]

# 🔹 Serializador de Clientes
class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ["id", "nombre", "empresa", "email", "telefono", "direccion", "fecha_registro"]
        extra_kwargs = {"email": {"required": False}}

# 🔹 Serializador de Pedidos
class PedidoSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all(), source="cliente", write_only=True, required=False)

    camion = CamionSerializer(read_only=True)
    camion_id = serializers.PrimaryKeyRelatedField(queryset=Camion.objects.all(), source="camion", write_only=True, required=False)

    conductor = ConductorSerializer(read_only=True)
    conductor_id = serializers.PrimaryKeyRelatedField(queryset=Conductor.objects.all(), source="conductor", write_only=True, required=False)

    class Meta:
        model = Pedido
        fields = [
            "id", "cliente", "cliente_id", "camion", "camion_id", "conductor", "conductor_id",
            "descripcion", "estado", "fecha_creacion", "fecha_entrega"
        ]

# 🔹 Serializador de Gastos de Camiones
class GastoCamionSerializer(serializers.ModelSerializer):
    camion = CamionSerializer(read_only=True)
    camion_id = serializers.PrimaryKeyRelatedField(queryset=Camion.objects.all(), source="camion", write_only=True)

    class Meta:
        model = GastoCamion
        fields = ["id", "camion", "camion_id", "tipo_gasto", "monto", "fecha", "comentarios"]

# 🔹 Serializador de Sueldos de Empleados
class SueldoEmpleadoSerializer(serializers.ModelSerializer):
    empleado = ConductorSerializer(read_only=True)  # Muestra datos completos del empleado
    empleado_id = serializers.PrimaryKeyRelatedField(queryset=Conductor.objects.all(), source="empleado", write_only=True)

    class Meta:
        model = SueldoEmpleado
        fields = [
            "id", "empleado", "empleado_id", "periodo_sueldo", "salario_base", "bonos", "deducciones",
            "horas_extras", "adelanto", "total_neto", "fecha_pago", "metodo_pago"
        ]
        read_only_fields = ["total_neto"]  # No permitir modificación manual del total neto

# 🔹 Serializador de Ubicaciones
class UbicacionSerializer(serializers.ModelSerializer):
    camion = CamionSerializer(read_only=True)  # Muestra datos completos del camión
    camion_id = serializers.PrimaryKeyRelatedField(queryset=Camion.objects.all(), source="camion", write_only=True)

    class Meta:
        model = Ubicacion
        fields = ["id", "camion", "camion_id", "latitud", "longitud", "timestamp"]

# 🔹 Serializador de Facturas
class FacturaSerializer(serializers.ModelSerializer):
 
    cliente = ClienteSerializer(read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(), source="cliente", write_only=True
    )

    pedido = PedidoSerializer(read_only=True)
    pedido_id = serializers.PrimaryKeyRelatedField(
        queryset=Pedido.objects.all(), source="pedido", write_only=True, required=False
    )

    # Campos calculados
    final_h = serializers.SerializerMethodField()
    importe_total = serializers.SerializerMethodField()

    class Meta:
        model = Factura
        fields = [
            'id', 'cliente', 'cliente_id', 'pedido', 'pedido_id', 'fecha', 'servicio',
            'origen', 'destino', 'horas_espera', 'precio_hora', 'peajes',
            'importe_lista', 'final_h', 'importe_total',
        ]
        read_only_fields = ['final_h', 'importe_total']  # Evita que el backend intente guardarlos

    def validate(self, data):
        """Validaciones personalizadas."""
        if 'horas_espera' in data and data['horas_espera'] < 0:
            raise serializers.ValidationError("Las horas de espera no pueden ser negativas.")
        if 'precio_hora' in data and data['precio_hora'] < 0:
            raise serializers.ValidationError("El precio por hora no puede ser negativo.")
        if 'importe_lista' in data and data['importe_lista'] < 0:
            raise serializers.ValidationError("El importe de lista no puede ser negativo.")
        return data

    def get_final_h(self, obj):
        """Calcula el costo final por horas de espera."""
        horas = Decimal(obj.horas_espera) if obj.horas_espera else Decimal(0)
        precio = Decimal(obj.precio_hora) if obj.precio_hora else Decimal(0)
        return horas * precio

    def get_importe_total(self, obj):
        """Calcula el importe total de la factura."""
        final_h = self.get_final_h(obj)
        peajes = Decimal(obj.peajes) if obj.peajes else Decimal(0)
        importe_lista = Decimal(obj.importe_lista) if obj.importe_lista else Decimal(0)
        return final_h + peajes + importe_lista

# 🔹 Serializador estadisticas
class ResumenGeneralSerializer(serializers.Serializer):
    total_pedidos = serializers.IntegerField()
    total_gastos = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_sueldos = serializers.DecimalField(max_digits=10, decimal_places=2)

class PedidosPorEstadoSerializer(serializers.Serializer):
    estado = serializers.CharField()
    total = serializers.IntegerField()

class GastosPorTipoSerializer(serializers.Serializer):
    tipo_gasto = serializers.CharField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)

class SueldosPorMesSerializer(serializers.Serializer):
    periodo_sueldo = serializers.CharField()
    total_sueldos = serializers.DecimalField(max_digits=10, decimal_places=2)