import { $ } from "bun";

const MILLISECOND = 1000;
const WAIT_BETWEEN_REQUESTS_MS = 1000;

const config = {
	url: "http://ctag-tbd.local/",
	paths: Bun.argv.slice(2),
	runsPerPath: 100,
	loadTimeScale: MILLISECOND,
	gzip: {
		command: "gzip -9 -k -f",
		fileEnding: ".gz",
		headerType: "gzip",
	},
} as const;

const maxPathLength = Math.max(...config.paths.map((path) => path.length));
let runsPerPathDigitsCount = 0;
let tmpRunsPerPath = config.runsPerPath;

while (tmpRunsPerPath >= 1) {
	tmpRunsPerPath /= 10;
	runsPerPathDigitsCount++;
}

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

type LoadTime = { loadTime: number; ttfb: number; rawResult: CurlResult };
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

	const ttfb = json.starttransferTime;
	const loadTime = json.totalTime;

	return { loadTime, ttfb, rawResult: json };
}

function calcMedian(runs: LoadTime[]): {
	avgTtfb: number;
	avgLoadTime: number;
} {
	if (runs.length == 0) {
		return { avgLoadTime: 0, avgTtfb: 0 };
	}

	const midIndex = Math.floor(runs.length / 2);
	const median = runs.toSorted((a, b) => a.loadTime - b.loadTime)[midIndex];

	return { avgTtfb: median.ttfb, avgLoadTime: median.loadTime };
}

async function printRunResult(
	pathname: string,
	runs: LoadTime[],
	loopIndex?: number,
): Promise<void> {
	const file = Bun.file(`../build/spiffs_image/www/${pathname}.gz`);
	const fileSizeInBytes = (await file.exists()) ? file.size : 0;
	const fileSizeInKB = fileSizeInBytes / 1000;
	const fileSizeWithPadding = `${(
		fileSizeInKB > 0 ? fileSizeInKB.toFixed(2) : "---.--"
	).padStart(6, " ")}kB`;
	const { avgTtfb, avgLoadTime } = calcMedian(runs);
	const avgTtfbWithPadding = `${avgTtfb.toFixed(2).padStart(6, " ")}ms`;
	const avgLoadTimeWithPadding = `${avgLoadTime.toFixed(2).padStart(6, " ")}ms`;
	const pathnameWithPadding = pathname.padEnd(maxPathLength, " ");
	const currentIndexWithPadding =
		loopIndex === undefined
			? " "
			: `${((loopIndex + 1) / config.runsPerPath).toString().padStart(runsPerPathDigitsCount, " ")}% `;
	const prefix = loopIndex === undefined || loopIndex > 0 ? "\r" : "";
	const rateWithPadding = `${(fileSizeInKB / avgLoadTime).toFixed(2).padStart(6, " ")}kB/ms`;

	Bun.write(
		Bun.stdout,
		`${prefix}Benchmarking ${pathnameWithPadding} ${fileSizeWithPadding}: ${currentIndexWithPadding}ttfb: ${avgTtfbWithPadding}, total: ${avgLoadTimeWithPadding}, ${rateWithPadding}`.padEnd(
			120,
			" ",
		),
	);
}

async function benchmarkPath(pathname: string) {
	const results: BenchmarkResult[] = [];
	const runs: LoadTime[] = [];

	for (let i = 0; i < config.runsPerPath; i++) {
		await printRunResult(pathname, runs, i);
		const result = await performRequest(pathname);
		runs.push(result);
		await new Promise((resolve) =>
			setTimeout(resolve, WAIT_BETWEEN_REQUESTS_MS),
		);
	}

	await printRunResult(pathname, runs);
	Bun.write(Bun.stdout, "\n");

	return results;
}

function analyzeResults(results: BenchmarkResult[]) {
	const analysis = results.map(({ pathname, runs }) => {
		const ttfbs = runs.map((r) => r.ttfb);
		const loadTimes = runs.map((r) => r.loadTime);
		ttfbs.sort((a, b) => a - b);
		loadTimes.sort((a, b) => a - b);

		// const minTtfb = ttfbs[0];
		// const maxTtfb = ttfbs[ttfbs.length - 1];
		const avgTtfb = ttfbs.reduce((a, b) => a + b) / ttfbs.length;
		// const minLoadTime = loadTimes[0];
		// const maxLoadTime = loadTimes[loadTimes.length - 1];
		const avgLoadTime = loadTimes.reduce((a, b) => a + b) / loadTimes.length;

		return {
			pathname,
			// "min ttfb (ms)": minTtfb.toFixed(2),
			"avg ttfb (ms)": avgTtfb.toFixed(2),
			// "max ttfb (ms)": maxTtfb.toFixed(2),
			// "min total (ms)": minLoadTime.toFixed(2),
			"avg total (ms)": avgLoadTime.toFixed(2),
			// "max total (ms)": maxLoadTime.toFixed(2),
		};
	});

	console.table(analysis);
}

const results: BenchmarkResult[] = [];

for (const pathname of config.paths) {
	results.push(...(await benchmarkPath(pathname)).flat());
}

// analyzeResults(results);
