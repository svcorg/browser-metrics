/* eslint-disable flowtype/require-valid-file-annotation */

/**
 * This is highly inspired by
 *  - https://github.com/addyosmani/timing.js/blob/master/timing.js
 *  - https://gist.github.com/acdha/a1fd7e91f8cd5c1f6916
 *  - https://github.com/okor/justice/blob/master/src/js/justice.collectors.js
 */

function supportsPerfNow() {
  return window.performance && window.performance.now;
}

function supportsPerfTiming() {
  return !!(window.performance &&
    window.performance.getEntriesByType('navigation') &&
    window.performance.getEntriesByType('navigation')[0]);
}

function getTimeSinceNavigationStart() {
  if (!supportsPerfNow()) {
    return null;
  }

  return Math.round(window.performance.now());
}

/**
 * Returns the browser first byte received metric (if available).
 *
 * @return {number} The first byte time in ms.
 */
function getTimeToFirstByte() {
  if (!supportsPerfTiming()) {
    return null;
  }

  const { timing } = window.performance;

  return timing.responseStart - timing.navigationStart;
}

/**
 * Returns the browser's first paint metric (if available).
 *
 * @return {number} The first paint time in ms.
 */
function getTimeToFirstPaint() {
  if (performance.getEntriesByType) {
    const [entry] = performance.getEntriesByType('paint');
    return (entry.startTime + performance.timeOrigin) * 1000;
  } else if (window.chrome && window.chrome.loadTimes) {
    const load = window.chrome.loadTimes();
    const firstPaintTime = (load.firstPaintTime - load.startLoadTime) * 1000;

    return Math.round(firstPaintTime);
  } else if (supportsPerfTiming()) {
    const { timing } = window.performance;

    // See http://msdn.microsoft.com/ff974719
    if (timing.msFirstPaint) {
      return timing.msFirstPaint - timing.navigationStart;
    }
  }

  return null;
}

// Track key moments in web page load timings ⚡️.
const browsingMetrics = (options = {}) => {
  const {
    trackTiming,
    sampleRate = 100, // %
    log = false,
  } = options;

  if (process.env.NODE_ENV === 'production' && Math.random() > sampleRate / 100) {
    return;
  }

  const timeToInteractive = getTimeSinceNavigationStart();

  const datas = [
    {
      name: 'timeToFirstByte',
      duration: getTimeToFirstByte(),
    },
    {
      name: 'timeToFirstPaint',
      duration: getTimeToFirstPaint(),
    },
    {
      name: 'timeToInteractive',
      duration: timeToInteractive,
    },
  ];

  datas.forEach(({ name, duration }) => {
    // Ignore incoherent durations.
    // We only consider values in the following window: ]0,1h].
    if (duration && duration < 3600000) {
      trackTiming('load', name, duration);
    }
  });

  if (log) {
    console.table(datas); // eslint-disable-line no-console
  }
};

export default browsingMetrics;
