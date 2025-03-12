from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CamionViewSet, ConductorViewSet, ClienteViewSet, PedidoViewSet, 
    UserViewSet, GastoCamionViewSet, SueldoEmpleadoViewSet, protected_view, 
    MetricasViewSet, UbicacionViewSet, FacturaViewSet  # Agregar FacturaViewSet
)

# 🔹 Configuración de rutas con DefaultRouter
router = DefaultRouter()
router.register(r'camiones', CamionViewSet)
router.register(r'conductores', ConductorViewSet)
router.register(r'clientes', ClienteViewSet)  # Endpoint para clientes
router.register(r'pedidos', PedidoViewSet)  # Endpoint para pedidos
router.register(r'usuarios', UserViewSet, basename="usuarios")  # Endpoint para gestionar el perfil del usuario
router.register(r'gastos', GastoCamionViewSet, basename="gastos")  # Endpoint para gastos de camiones
router.register(r'sueldos', SueldoEmpleadoViewSet, basename="sueldos")  # 🆕 Nuevo endpoint para sueldos de empleados
router.register(r'metricas', MetricasViewSet, basename="metricas")
router.register(r'ubicaciones', UbicacionViewSet, basename="ubicaciones")  # 🆕 Nuevo endpoint para ubicaciones
router.register(r'facturas', FacturaViewSet, basename="facturas")  # 🆕 Nuevo endpoint para facturas

urlpatterns = [
    path('', include(router.urls)),  # Incluye todas las rutas registradas en el router
    path('protected/', protected_view, name='protected_view'),  # Ruta protegida de prueba
    path('api/', include(router.urls)),
]