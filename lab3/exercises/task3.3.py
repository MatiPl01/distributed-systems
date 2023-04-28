# 3.3 Take a look on implement parralel Pi computation
# based on https://docs.ray.io/en/master/ray-core/examples/highly_parallel.html
#
# Implement calculating pi as a combination of actor (which keeps the
# state of the progress of calculating pi as it approaches its final value)
# and a task (which computes candidates for pi)
import ray
import math
import time
import random
import logging

ray.init(address='auto', logging_level=logging.ERROR)


@ray.remote
def pi4_sample(pi_calculator, sample_count):
    """pi4_sample runs sample_count experiments, and returns the
    fraction of time it was inside the circle.
    """
    in_count = 0
    for i in range(sample_count):
        x = random.random()
        y = random.random()
        if x ** 2 + y ** 2 <= 1:
            in_count += 1

    pi_calculator.add_samples.remote(in_count, sample_count)


@ray.remote
class PiEstimator:
    """PiEstimator keeps track of the state of the computation.
    """
    def __init__(self):
        self.in_count = 0
        self.total_count = 0

    def add_samples(self, in_count, total_count):
        """add_samples adds samples to the running estimate.
        """
        self.in_count += in_count
        self.total_count += total_count

    def get_state(self):
        return self.in_count, self.total_count

    def estimate(self):
        """estimate returns the current estimate of pi.
        """
        return 4.0 * self.in_count / self.total_count if self.total_count else 0.0


if __name__ == '__main__':
    random.seed(42)

    SAMPLE_COUNT = 1_000_000
    FULL_SAMPLE_COUNT = 100_000_000_000
    BATCHES = int(FULL_SAMPLE_COUNT / SAMPLE_COUNT)

    # Create an instance of our Actor
    pi_estimator_ref = PiEstimator.remote()

    # Create a list of tasks to run
    tasks_refs = [pi4_sample.remote(pi_estimator_ref, SAMPLE_COUNT) for _ in range(BATCHES)]

    while True:
        ready_refs, remaining_refs = ray.wait(tasks_refs, num_returns=1, timeout=None)

        if not remaining_refs:
            break

        pi_estimation = ray.get(pi_estimator_ref.estimate.remote())
        relative_error = abs(pi_estimation - math.pi) / math.pi
        _, total_count = ray.get(pi_estimator_ref.get_state.remote())
        print(f'Estimation after {total_count} samples: {pi_estimation} (error: {relative_error})')
        tasks_refs = remaining_refs
        time.sleep(1)
