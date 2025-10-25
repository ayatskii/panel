# Generated migration for MediaTag model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('media', '0004_mediafolder_updated_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='MediaTag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(db_index=True, max_length=50, unique=True)),
                ('color', models.CharField(default='#2196F3', help_text='Hex color code', max_length=7)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Media Tag',
                'verbose_name_plural': 'Media Tags',
                'db_table': 'media_tags',
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='media',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='media_files', to='media.mediatag', db_table='media_media_tags'),
        ),
    ]

