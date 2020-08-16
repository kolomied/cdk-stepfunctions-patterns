import random

class Backoff:
    def __init__(self, base, backoff, cap):
        self.base = base
        self.backoff = backoff
        self.cap = cap

    def expo(self, n):
      return min(self.cap, pow(self.backoff, n) * self.base)
      
    def backoff(self, n):
      v = self.expo(n)
      return random.uniform(0, v)

    def decor(self, n):
      sleep = self.backoff(n)
      return min(cap, random.uniform(self.base, sleep * 3))

def lambda_handler(event, context):
  n = event.get("RetryCount", 0)
  base = event.get("Interval", 1)
  backoff = event.get("Backoff", 2)

  fullBackoff = Backoff(base, backoff, 200)
  return round(fullBackoff.backoff(n))
