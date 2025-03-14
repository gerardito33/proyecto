# Generated by Django 5.1.7 on 2025-03-08 05:16

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_cliente_empresa'),
    ]

    operations = [
        migrations.CreateModel(
            name='GastoCamion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_gasto', models.CharField(choices=[('combustible', 'Combustible'), ('reparacion', 'Reparación'), ('filtros', 'Filtros'), ('seguro', 'Seguro'), ('otros', 'Otros')], max_length=20)),
                ('monto', models.DecimalField(decimal_places=2, max_digits=10)),
                ('fecha', models.DateField()),
                ('comentarios', models.TextField(blank=True, null=True)),
                ('camion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gastos', to='core.camion')),
            ],
        ),
    ]
