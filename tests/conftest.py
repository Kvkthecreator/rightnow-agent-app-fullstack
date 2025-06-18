import httpx

_orig_init = httpx.Client.__init__

def _patched_init(self, *args, **kwargs):
    kwargs.pop('app', None)
    return _orig_init(self, *args, **kwargs)

httpx.Client.__init__ = _patched_init
