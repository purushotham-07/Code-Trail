const ALGORITHM_LIBRARY = {
  binarySearch: {
    label: 'Binary Search',
    time: 'O(log n)',
    space: 'O(1)',
    referenceCode: `int binarySearch(int[] nums, int target) {
  int left = 0, right = nums.length - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
  },
  mergeSort: {
    label: 'Merge Sort',
    time: 'O(n log n)',
    space: 'O(n)',
    referenceCode: `void mergeSort(int[] arr, int left, int right) {
  if (left >= right) return;
  int mid = left + (right - left) / 2;
  mergeSort(arr, left, mid);
  mergeSort(arr, mid + 1, right);
  merge(arr, left, mid, right);
}`,
  },
  bfs: {
    label: 'Breadth-First Search',
    time: 'O(V + E)',
    space: 'O(V)',
    referenceCode: `void bfs(int start) {
  Queue<Integer> queue = new ArrayDeque<>();
  queue.offer(start);
  visited[start] = true;
  while (!queue.isEmpty()) {
    int node = queue.poll();
    for (int next : graph.get(node)) {
      if (!visited[next]) {
        visited[next] = true;
        queue.offer(next);
      }
    }
  }
}`,
  },
  dfs: {
    label: 'Depth-First Search',
    time: 'O(V + E)',
    space: 'O(V)',
    referenceCode: `void dfs(int node) {
  visited[node] = true;
  for (int next : graph.get(node)) {
    if (!visited[next]) {
      dfs(next);
    }
  }
}`,
  },
  bubbleSort: {
    label: 'Bubble Sort',
    time: 'O(n^2)',
    space: 'O(1)',
    referenceCode: `void bubbleSort(int[] arr) {
  for (int i = 0; i < arr.length; i++) {
    for (int j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        int temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`,
  },
  dynamicProgramming: {
    label: 'Dynamic Programming',
    time: 'O(n * m)',
    space: 'O(n * m)',
    referenceCode: `int dp[] = new int[n + 1];
for (int i = 1; i <= n; i++) {
  for (int j = 1; j <= m; j++) {
    dp[i] = Math.max(dp[i], dp[i - 1] + cost[i][j]);
  }
}`,
  },
};

const normalize = (value = '') => value.toLowerCase();

const detectAlgorithm = (code = '') => {
  const text = normalize(code);

  if (/(binary search|mid.*left|right.*mid|while.*left.*right|low.*high)/.test(text)) {
    return 'binarySearch';
  }

  if (/(merge sort|merge\(|left.*mid.*right|mergesort)/.test(text)) {
    return 'mergeSort';
  }

  if (/(queue|deque|breadth|bfs)/.test(text)) {
    return 'bfs';
  }

  if (/(stack|dfs|depth|visited\[.*\]|recurs)/.test(text)) {
    return 'dfs';
  }

  if (/(dp\[|dynamic programming|memo|lru)/.test(text)) {
    return 'dynamicProgramming';
  }

  if (/(bubble sort|swap.*arr\[j|arr\[j\+1\]|j \+ 1)/.test(text)) {
    return 'bubbleSort';
  }

  if (/(for \(.*\n.*for \(.*\))/s.test(text)) {
    return 'bubbleSort';
  }

  return null;
};

export const analyzeCodeComplexity = (code = '', language = 'javascript') => {
  const algorithmKey = detectAlgorithm(code);
  const info = ALGORITHM_LIBRARY[algorithmKey] || null;

  const complexityText = info
    ? `${info.label} → Time ${info.time}, Space ${info.space}`
    : 'No standard DSA pattern detected. Use a reference code sample and compare the control-flow structure to confirm the complexity.';

  const codeSnippet = code.trim();
  const comparisonResult = info
    ? `${info.label} reference code is a clean baseline with no comments.`
    : 'Reference comparison is limited to the standard patterns the analyzer can recognize.';

  return {
    language,
    algorithm: info?.label || 'Unrecognized pattern',
    timeComplexity: info?.time || 'N/A',
    spaceComplexity: info?.space || 'N/A',
    complexityText,
    referenceCode: info?.referenceCode || '',
    comparisonResult,
    isRecognized: Boolean(info),
    sourceCode: codeSnippet,
  };
};
