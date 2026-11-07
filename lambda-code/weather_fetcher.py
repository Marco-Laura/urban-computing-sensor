import os
from datetime import datetime, timezone
from urllib.request import urlopen

import boto3

s3 = boto3.client("s3")

WEATHER_URL = "https://www.met.ie/latest-reports/observations/download"


def main():
    with urlopen(WEATHER_URL, timeout=10) as response:
        weather_csv = response.read()

    downloaded_at = datetime.now(timezone.utc)
    filename = downloaded_at.strftime("weather/%Y-%m-%d/%H-%M-%S.csv")

    s3.put_object(
        Bucket=os.environ["BUCKET_NAME"],
        Key=filename,
        Body=weather_csv,
        ContentType="text/csv",
    )

    print("Weather saved:", filename)


def lambda_handler(event, context):
    main()