# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('media', '0005_add_media_tags'),
    ]

    operations = [
        migrations.AddField(
            model_name='media',
            name='thumbnail',
            field=models.FileField(blank=True, null=True, upload_to='media/%Y/%m/%d/thumbnails/'),
        ),
        migrations.AddField(
            model_name='media',
            name='medium',
            field=models.FileField(blank=True, null=True, upload_to='media/%Y/%m/%d/medium/'),
        ),
        migrations.AddField(
            model_name='media',
            name='large',
            field=models.FileField(blank=True, null=True, upload_to='media/%Y/%m/%d/large/'),
        ),
        migrations.AddField(
            model_name='media',
            name='webp',
            field=models.FileField(blank=True, null=True, upload_to='media/%Y/%m/%d/webp/'),
        ),
        migrations.AddField(
            model_name='media',
            name='is_optimized',
            field=models.BooleanField(default=False, help_text='Whether image variants have been generated'),
        ),
    ]

