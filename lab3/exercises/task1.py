# Exercises 1.1) Try using local bubble sort and remote bubble sort,
# show difference
import os
import ray
import random
import logging
import cProfile
from copy import copy

ray.init(address='auto', logging_level=logging.ERROR)


def create_array(size):
    return random.sample(range(size), size)


def bubble_sort(arr):
    arr_copy = copy(arr)

    for _ in range(len(arr_copy)):
        for j in range(len(arr_copy) - 1):
            if arr_copy[j] > arr_copy[j + 1]:
                arr_copy[j], arr_copy[j + 1] = arr_copy[j + 1], arr_copy[j]

    return arr_copy


@ray.remote
def bubble_sort_distributed(arr):
    return bubble_sort(arr)


def run_local_bubble_sort(arr, repeat_count):
    return [bubble_sort(arr) for _ in range(repeat_count)]


def run_remote_bubble_sort(arr, repeat_count):
    return ray.get([bubble_sort_distributed.remote(arr) for _ in range(repeat_count)])


if __name__ == '__main__':
    random.seed(0)

    array_size = 10000
    repeat_count = os.cpu_count()
    array = create_array(array_size)

    print('local bubble sort run')
    cProfile.run('run_local_bubble_sort(array, repeat_count)')

    print('remote bubble sort run')
    cProfile.run('run_remote_bubble_sort(array, repeat_count)')
