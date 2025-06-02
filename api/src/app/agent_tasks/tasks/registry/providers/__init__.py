"""Provider registry for task types"""
def get_provider():
    from .file import FileProvider
    return FileProvider()