# 3.1. Modify the Actor class MethodStateCounter and add/modify methods that return the following:
# a) - Get the number of times an invoker name was called
# b) - Get a list of values computed by invoker name
# c) - Get state of all invokers
# 3.2 Modify method invoke to return a random int value between [5, 25]
import ray
import time
import random
import logging

ray.init(address='auto', logging_level=logging.ERROR)

CALLERS = ['A', 'B', 'C']


@ray.remote
class MethodStateCounter:
    def __init__(self):
        self.invokers_calls = dict.fromkeys(CALLERS, 0)
        self.invokers_values = {name: [] for name in CALLERS}

    def invoke(self, name):
        # pretend to do some work here
        time.sleep(0.5)
        # update times invoked
        self.invokers_calls[name] += 1
        # update values
        value = random.randint(5, 25)
        self.invokers_values[name].append(value)
        # return the value
        return value

    def get_invoker_calls(self, name):
        return self.invokers_calls[name]

    def get_invoker_values(self, name):
        return self.invokers_values[name]

    def get_all_invoker_state(self):
        return self.invokers_calls, self.invokers_values


if __name__ == '__main__':
    # Create an instance of our Actor
    worker_invoker = MethodStateCounter.remote()

    # Iterate and call the invoke() method by random callers and keep track of who
    # called it.
    for _ in range(10):
        name = random.choice(CALLERS)
        worker_invoker.invoke.remote(name)

    # Invoke a random caller and fetch the value or invocations of a random caller
    print('method callers')
    for _ in range(5):
        random_name_invoker = random.choice(CALLERS)
        value = ray.get(worker_invoker.invoke.remote(random_name_invoker))
        times_invoked = ray.get(worker_invoker.get_invoker_calls.remote(random_name_invoker))
        print(f'Named caller: {random_name_invoker} returned {value} (called {times_invoked} times in total)')

    # Fetch numbers of calls and values for all callers
    print('all callers')
    invokers_calls, invokers_values = ray.get(worker_invoker.get_all_invoker_state.remote())
    print('Calls:', invokers_calls)
    print('Values:', invokers_values)
