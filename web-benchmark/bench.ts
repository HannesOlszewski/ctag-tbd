import { $ } from "bun";

const MILLISECOND = 1000;

const config = {
  url: "http://ctag-tbd.local/",
  paths: Bun.argv.slice(2),
  runsPerPath: 50,
  loadTimeScale: MILLISECOND,
  gzip: {
    command: "gzip -9 -k -f",
    fileEnding: ".gz",
    headerType: "gzip",
  },
} as const;

const curlFormat = (await Bun.file("curl-format-json.txt").text()).trim();

type CurlResult = {
  namelookupTime: number;
  connectTime: number;
  appconnectTime: number;
  pretransferTime: number;
  redirectTime: number;
  starttransferTime: number;
  totalTime: number;
};

type LoadTime = { loadTime: number; rawResult: CurlResult };
type BenchmarkResult = {
  pathname: string;
  runs: LoadTime[];
};

async function performRequest(pathname: string): Promise<LoadTime> {
  const fullUrl = config.url + pathname;
  const encodingHeader = `-H "Accept-encoding: ${config.gzip.headerType}" `;

  const result =
    await $`curl -w "${curlFormat}" -o /dev/null -s -4 ${{ raw: encodingHeader }}"${fullUrl}"`
      .nothrow()
      .text();

  const json: CurlResult = JSON.parse(result);

  for (const key of Object.keys(json)) {
    const jsonKey = key as keyof CurlResult;
    json[jsonKey] *= config.loadTimeScale;
  }

  const loadTime = json.totalTime - json.pretransferTime;

  return { loadTime, rawResult: json };
}

async function benchmarkPath(pathname: string) {
  const results: BenchmarkResult[] = [];

  const runs: LoadTime[] = [];

  for (let i = 0; i < config.runsPerPath; i++) {
    Bun.write(
      Bun.stdout,
      `${i > 0 ? "\r" : ""}Benchmarking ${pathname}: ${i + 1}/${config.runsPerPath}`,
    );
    const result = await performRequest(pathname);
    runs.push(result);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  results.push({ pathname, runs });
  Bun.write(Bun.stdout, "\r");

  return results;
}

function analyzeResults(results: BenchmarkResult[]) {
  const analysis = results.map(({ pathname, runs }) => {
    const loadTimes = runs.map((r) => r.loadTime);
    loadTimes.sort((a, b) => a - b);

    const min = loadTimes[0];
    const max = loadTimes[loadTimes.length - 1];
    const avg = loadTimes.reduce((a, b) => a + b) / loadTimes.length;

    // const connectionTimes = runs.map((r) => r.rawResult.connectTime);
    // const avgConnection =
    //   connectionTimes.reduce((a, b) => a + b) / connectionTimes.length;

    return {
      pathname,
      "min (ms)": min.toFixed(2),
      "avg (ms)": avg.toFixed(2),
      "max (ms)": max.toFixed(2),
      // "avg connection (ms)": avgConnection.toFixed(2),
      // "all times": loadTimes.map((t) => t.toFixed(2)),
    };
  });

  console.table(analysis);
}

const results = (await Promise.all(config.paths.map(benchmarkPath))).flat();
analyzeResults(results);
