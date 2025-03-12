from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import home  # Importamos la vista para la raíz

urlpatterns = [
    # Panel de administración de Django
    path('admin/', admin.site.urls),

    # API de la aplicación core (Camiones, Conductores, Clientes, Pedidos)
    path('api/', include('core.urls')),

    # Autenticación con JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Ruta raíz con mensaje de bienvenida
    path('', home, name='home'),
]

