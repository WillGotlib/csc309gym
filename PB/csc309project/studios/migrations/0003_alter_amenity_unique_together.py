# Generated by Django 4.0.8 on 2022-11-20 03:03

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('studios', '0002_alter_amenity_studio_alter_class_studio_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='amenity',
            unique_together={('studio', 'type', 'quantity')},
        ),
    ]
