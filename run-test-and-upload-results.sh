#!/bin/bash

#Reporter Options
export PLAYWRIGHT_HTML_OPEN=never

# Timestamped folder
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FOLDER="playwright-report"
UPLOAD_FOLDER="reports"

echo "Running Playwright tests..."
npx playwright test --reporter=html --workers=1 || EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then

    ZIP_FILE="playwright-report-$TIMESTAMP.zip"
    zip -r "$ZIP_FILE" "playwright-report/"

    az storage blob upload \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --container-name "$CONTAINER_NAME" \
    --file $ZIP_FILE \
    --name "$UPLOAD_FOLDER/$ZIP_FILE" \
    --overwrite true \
    --account-key "$AZURE_STORAGE_KEY"

fi

exit $EXIT_CODE