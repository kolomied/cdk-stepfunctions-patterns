import random

class Backoff:
    def __init__(self, base, backoff, cap):
        self.__base = base
        self.__backoff = backoff
        self.__cap = cap

    def expo(self, n):
      return min(self.__cap, pow(self.__backoff, n) * self.__base)
      
    def backoff(self, n):
      v = self.expo(n)
      return random.uniform(0, v)

    def decor(self, n):
      sleep = self.backoff(n)
      return min(self.__cap, random.uniform(self.__base, sleep * 3))

def lambda_handler(event, context):
  n = event.get("RetryCount", 0)
  base = event.get("Interval", 1)
  backoff = event.get("Backoff", 2)

  fullBackoff = Backoff(base, backoff, 200) # TODO: parameterize cap
  return round(fullBackoff.backoff(n))
