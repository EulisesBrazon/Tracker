import { scrapeBcvRateV2 } from '../backend/helpers/bcvScraperHelper-V2';

async function main() {
  console.log('== run-bcv-scrape: start ==');
  console.log('env BCV_ALLOW_INSECURE =', process.env.BCV_ALLOW_INSECURE ?? '<not set>');
  try {
    const result = await scrapeBcvRateV2();
    console.log('== scrape success ==');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('== scrape failed ==');
    console.error(err && (err as any).stack ? (err as any).stack : err);
    process.exit(1);
  }
}

main();
