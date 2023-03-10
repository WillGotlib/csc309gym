# Generated by Django 4.0.8 on 2022-11-17 20:58

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Class',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('coach', models.CharField(blank=True, max_length=200, null=True)),
                ('keywords', models.CharField(blank=True, max_length=200, null=True)),
                ('capacity', models.PositiveIntegerField(blank=True, null=True)),
            ],
            options={
                'verbose_name_plural': 'Classes',
            },
        ),
        migrations.CreateModel(
            name='ClassTime',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.CharField(choices=[('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'), ('Thursday', 'Thursday'), ('Friday', 'Friday'), ('Saturday', 'Saturday'), ('Sunday', 'Sunday')], max_length=9)),
                ('time', models.TimeField()),
                ('duration', models.PositiveIntegerField(verbose_name='Duration (Hours)')),
                ('start_date', models.DateField()),
                ('class_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='studios.class', verbose_name='Class')),
            ],
            options={
                'unique_together': {('class_id', 'day', 'time')},
            },
        ),
        migrations.CreateModel(
            name='RecurringEnroll',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_datetime', models.DateTimeField(default=django.utils.timezone.now)),
                ('end_datetime', models.DateTimeField(blank=True, default=None, null=True)),
                ('class_time', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='studios.classtime')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('class_time', 'user', 'start_datetime')},
            },
        ),
        migrations.CreateModel(
            name='Studio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('lat', models.DecimalField(decimal_places=6, max_digits=9, verbose_name='Latitude')),
                ('lng', models.DecimalField(decimal_places=6, max_digits=9, verbose_name='Longitude')),
                ('address', models.CharField(blank=True, max_length=200, null=True)),
                ('postal_code', models.CharField(blank=True, max_length=50, null=True)),
                ('phone', models.CharField(blank=True, max_length=12, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='StudioImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='studio_images/')),
                ('studio', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='studios.studio')),
            ],
        ),
        migrations.CreateModel(
            name='RecurringEnrollSpecificSessionDrop',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_num', models.PositiveIntegerField()),
                ('recurring_enroll', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='studios.recurringenroll')),
            ],
        ),
        migrations.AddField(
            model_name='class',
            name='studio',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='studios.studio'),
        ),
        migrations.CreateModel(
            name='SpecificSessionCancellation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_num', models.PositiveIntegerField()),
                ('class_time', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='studios.classtime')),
            ],
            options={
                'unique_together': {('class_time', 'session_num')},
            },
        ),
        migrations.CreateModel(
            name='IndividualEnroll',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_num', models.PositiveIntegerField()),
                ('class_time', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='studios.classtime')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('class_time', 'user', 'session_num')},
            },
        ),
        migrations.CreateModel(
            name='Amenity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(max_length=200)),
                ('quantity', models.PositiveIntegerField()),
                ('studio', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='studios.studio')),
            ],
            options={
                'verbose_name_plural': 'Amenities',
                'unique_together': {('studio', 'type')},
            },
        ),
    ]
