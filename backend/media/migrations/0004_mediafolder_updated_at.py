# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("media", "0003_media_caption_media_updated_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="mediafolder",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]

