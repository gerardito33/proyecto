from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.contrib.auth.models import User
from django.db.models import Sum, Count
from datetime import datetime
from .models import Camion, Conductor, Cliente, Pedido, GastoCamion, SueldoEmpleado, Ubicacion, Factura
from .serializers import (
    CamionSerializer, ConductorSerializer, ClienteSerializer, PedidoSerializer,
    UserSerializer, GastoCamionSerializer, SueldoEmpleadoSerializer, ResumenGeneralSerializer, PedidosPorEstadoSerializer, 
    GastosPorTipoSerializer, SueldosPorMesSerializer, UbicacionSerializer, FacturaSerializer
)
from django.http import JsonResponse

# Gestión de Conductores
class ConductorViewSet(viewsets.ModelViewSet):
    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer
    permission_classes = [IsAuthenticated]

# Gestión de Camiones
class CamionViewSet(viewsets.ModelViewSet):
    queryset = Camion.objects.all()
    serializer_class = CamionSerializer
    permission_classes = [IsAuthenticated]

# Gestión de Clientes
class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

# Gestión de Pedidos
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

# Gestión de Gastos de Camiones
class GastoCamionViewSet(viewsets.ModelViewSet):
    queryset = GastoCamion.objects.all()
    serializer_class = GastoCamionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Lista todos los gastos o filtra por camión si se proporciona `camion_id`"""
        camion_id = self.request.query_params.get("camion_id")
        if camion_id:
            return GastoCamion.objects.filter(camion_id=camion_id)
        return GastoCamion.objects.all()

    @action(detail=False, methods=["get"])
    def gastos_por_mes(self, request):
        """Calcula el total de gastos por camión en un mes específico"""
        camion_id = request.query_params.get("camion_id")
        mes = request.query_params.get("mes")

        if not camion_id or not mes:
            return Response({"error": "camion_id y mes son requeridos"}, status=400)

        try:
            año, mes = map(int, mes.split("-"))
            total_gasto = GastoCamion.objects.filter(
                camion_id=camion_id,
                fecha__year=año,
                fecha__month=mes
            ).aggregate(total=Sum("monto"))["total"] or 0

            return Response({"camion_id": camion_id, "mes": f"{año}-{mes:02d}", "total_gasto": total_gasto})
        except ValueError:
            return Response({"error": "Formato de mes inválido (usar YYYY-MM)"}, status=400)

    @action(detail=False, methods=["get"])
    def gastos_totales(self, request):
        """Calcula el total de gastos de todos los camiones, opcionalmente filtrando por mes"""
        mes = request.query_params.get("mes")

        filtro = {}
        if mes:
            try:
                año, mes = map(int, mes.split("-"))
                filtro["fecha__year"] = año
                filtro["fecha__month"] = mes
            except ValueError:
                return Response({"error": "Formato de mes inválido (usar YYYY-MM)"}, status=400)

        total_gasto = GastoCamion.objects.filter(**filtro).aggregate(total=Sum("monto"))["total"] or 0

        return Response({"mes": mes if mes else "Todos los meses", "total_gasto": total_gasto})

# Gestión de Sueldos de Empleados
class SueldoEmpleadoViewSet(viewsets.ModelViewSet):
    queryset = SueldoEmpleado.objects.all()
    serializer_class = SueldoEmpleadoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Lista todos los sueldos o filtra por empleado si se proporciona `empleado_id`"""
        empleado_id = self.request.query_params.get("empleado_id")
        if empleado_id:
            return SueldoEmpleado.objects.filter(empleado_id=empleado_id)
        return SueldoEmpleado.objects.all()

    @action(detail=False, methods=["get"])
    def sueldos_por_mes(self, request):
        """Calcula el total de sueldos pagados en un mes específico"""
        mes = request.query_params.get("mes")

        if not mes:
            return Response({"error": "El mes es requerido (formato YYYY-MM)"}, status=400)

        try:
            año, mes = map(int, mes.split("-"))
            total_sueldos = SueldoEmpleado.objects.filter(
                fecha_pago__year=año,
                fecha_pago__month=mes
            ).aggregate(total=Sum("total_neto"))["total"] or 0

            return Response({"mes": f"{año}-{mes:02d}", "total_sueldos": total_sueldos})
        except ValueError:
            return Response({"error": "Formato de mes inválido (usar YYYY-MM)"}, status=400)

    @action(detail=False, methods=["get"])
    def reporte_sueldos(self, request):
        """Devuelve un reporte de sueldos con total y filtro opcional por mes"""
        mes = request.query_params.get("mes")

        filtro = {}
        if mes:
            try:
                año, mes = map(int, mes.split("-"))
                filtro["fecha_pago__year"] = año
                filtro["fecha_pago__month"] = mes
            except ValueError:
                return Response({"error": "Formato de mes inválido (usar YYYY-MM)"}, status=400)

        total_sueldos = SueldoEmpleado.objects.filter(**filtro).aggregate(total=Sum("total_neto"))["total"] or 0

        return Response({"mes": mes if mes else "Todos los meses", "total_sueldos": total_sueldos})

# Gestión de Ubicaciones
class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Lista todas las ubicaciones o filtra por camión si se proporciona `camion_id`"""
        camion_id = self.request.query_params.get("camion_id")
        if camion_id:
            return Ubicacion.objects.filter(camion_id=camion_id)
        return Ubicacion.objects.all()

    @action(detail=False, methods=["get"])
    def ubicacion_actual(self, request):
        """Obtiene la última ubicación registrada de un camión específico"""
        camion_id = request.query_params.get("camion_id")
        if not camion_id:
            return Response({"error": "camion_id es requerido"}, status=400)

        try:
            ubicacion = Ubicacion.objects.filter(camion_id=camion_id).latest("timestamp")
            serializer = UbicacionSerializer(ubicacion)
            return Response(serializer.data)
        except Ubicacion.DoesNotExist:
            return Response({"error": "No se encontraron ubicaciones para este camión"}, status=404)

# Gestión de Facturas
class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra las facturas por cliente, pedido o fecha si se proporcionan los parámetros.
        """
        queryset = Factura.objects.all()
        
        # Filtro por cliente
        cliente_id = self.request.query_params.get("cliente_id")
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        
        # Filtro por pedido
        pedido_id = self.request.query_params.get("pedido_id")
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)
        
        # Filtro por fecha
        fecha = self.request.query_params.get("fecha")
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        
        return queryset

    @action(detail=False, methods=["get"])
    def facturas_por_mes(self, request):
        """
        Calcula el total de facturas emitidas en un mes específico.
        """
        mes = request.query_params.get("mes")

        if not mes:
            return Response({"error": "El mes es requerido (formato YYYY-MM)"}, status=400)

        try:
            año, mes = map(int, mes.split("-"))
            total_facturas = Factura.objects.filter(
                fecha__year=año,
                fecha__month=mes
            ).aggregate(total=Sum("importe_total"))["total"] or 0

            return Response({"mes": f"{año}-{mes:02d}", "total_facturas": total_facturas})
        except ValueError:
            return Response({"error": "Formato de mes inválido (usar YYYY-MM)"}, status=400)

    @action(detail=False, methods=["get"])
    def resumen_facturas(self, request):
        """
        Devuelve un resumen de facturas con el total de importes por mes.
        """
        resumen = Factura.objects.values("fecha__year", "fecha__month").annotate(
            total_importe=Sum("importe_total")
        ).order_by("fecha__year", "fecha__month")

        return Response(resumen)

# Vista para obtener métricas y estadísticas generales
class MetricasViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def pedidos_por_estado(self, request):
        """Obtiene la cantidad de pedidos por estado (Pendiente, Completado, Cancelado)"""
        datos = Pedido.objects.values("estado").annotate(total=Count("id"))
        return Response(PedidosPorEstadoSerializer(datos, many=True).data)

    @action(detail=False, methods=["get"])
    def gastos_por_tipo(self, request):
        """Suma los gastos agrupados por tipo (Combustible, Reparación, etc.)"""
        datos = GastoCamion.objects.values("tipo_gasto").annotate(total=Sum("monto"))
        return Response(GastosPorTipoSerializer(datos, many=True).data)

    @action(detail=False, methods=["get"])
    def sueldos_por_mes(self, request):
        """Calcula el total de sueldos pagados por mes"""
        datos = SueldoEmpleado.objects.values("periodo_sueldo").annotate(total_sueldos=Sum("total_neto"))
        return Response(SueldosPorMesSerializer(datos, many=True).data)

    @action(detail=False, methods=["get"])
    def resumen_general(self, request):
        """Resumen general con total de pedidos, gastos y sueldos"""
        total_pedidos = Pedido.objects.count()
        total_gastos = GastoCamion.objects.aggregate(total=Sum("monto"))["total"] or 0
        total_sueldos = SueldoEmpleado.objects.aggregate(total=Sum("total_neto"))["total"] or 0

        data = {
            "total_pedidos": total_pedidos,
            "total_gastos": total_gastos,
            "total_sueldos": total_sueldos
        }
        serializer = ResumenGeneralSerializer(data)
        return Response(serializer.data)

# Gestión del Usuario (Perfil)
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["put"])
    def update_profile(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# Vista protegida de prueba
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({"message": "Acceso permitido, usuario autenticado", "user": request.user.username})

# Vista de bienvenida
def home(request):
    return JsonResponse({"message": "Bienvenido a la API de Gestión de Camiones"})