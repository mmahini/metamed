import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("organization", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="branch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="staff",
                to="organization.branch",
                verbose_name="شعبه",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="unit",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="staff",
                to="organization.unit",
                verbose_name="واحد",
            ),
        ),
    ]
