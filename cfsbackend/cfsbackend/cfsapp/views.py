from django.shortcuts import render

from django.contrib.auth.models import User, Group
from rest_framework import viewsets
from .models import Incident, Call
from cfsbackend.cfsapp.serializers import UserSerializer, GroupSerializer, IncidentSerializer, CallSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


class IncidentViewSet(viewsets.ModelViewSet):
	"""
    API endpoint that allows incidents to be viewed or edited.
    """
	queryset = Incident.objects.all()
	serializer_class = IncidentSerializer


class CallViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows calls to be viewed or edited.
    """
    queryset = Call.objects.all()
    serializer_class = CallSerializer
