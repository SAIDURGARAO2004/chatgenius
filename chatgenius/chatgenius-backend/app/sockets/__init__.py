from .messaging import register_message_events

def register_socket_events(socketio):
    register_message_events(socketio)
