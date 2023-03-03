from rest_framework import serializers

from .models import User


class SignupRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    password = serializers.CharField()

    def validate_username(self, username):
        """Ensure the username is unique"""

        if User.objects.filter(username=username).count():
            raise serializers.ValidationError("Username already exist")
        return username


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "picture", "settings")
