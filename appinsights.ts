import * as appInsights from 'applicationinsights';
import {logger} from './logger';

const client = new appInsights.TelemetryClient(process.env.APPINSIGHTS_CONNECTION_STRING);

async function trackAvailabilityFromTestResult(testName: string, status: 'pass' | 'fail', durationMs: number, error?: string) {

    if (!client) {
        logger.warn('Application Insights client not initialized.');
        return;
    }

    client.trackEvent({name: 'TestExecuted', properties: {testName, status}});

    logger.debug(`Tracking availability for test: ${testName}, status: ${status}, duration: ${durationMs}ms`);
    client.trackAvailability({
      id: 's',
      name: testName,
      success: status === 'pass',
      duration: durationMs,
      runLocation: process.env.NODE_ENV || 'local',
      message: error || (status === 'pass' ? 'Test passed' : 'Test failed'),
    });

    if (error) {
        client.trackException({exception: new Error(error)});
    }

    await client.flush();

    await new Promise(res => setTimeout(res, 1000)); // 1 second

}



export { trackAvailabilityFromTestResult };