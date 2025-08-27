import time
import logging

logger = logging.getLogger("phoenix")

class RequestTimer:
    def __enter__(self): 
        self.t = time.perf_counter()
        return self
    
    def __exit__(self, exc_type, exc, tb): 
        self.dt = int((time.perf_counter()-self.t)*1000)