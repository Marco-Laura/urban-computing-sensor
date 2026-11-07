import json
import os

import boto3

s3 = boto3.client("s3")


def response(status_code, message):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(message),
    }


def lambda_handler(event, context):
    headers = event.get("headers", {})
    supplied_token = headers.get("x-upload-token")

    if supplied_token != os.environ["UPLOAD_TOKEN"]:
        return response(401, {"error": "Invalid upload token"})

    try:
        data = json.loads(event["body"])
    except (KeyError, json.JSONDecodeError, TypeError):
        return response(400, {"error": "Missing or invalid JSON body"})

    if not isinstance(data, dict):
        return response(400, {"error": "Expected a JSON object"})

    recording_id = data.get("recording_id")
    batch_number = data.get("batch_number")
    readings = data.get("readings")

    if not isinstance(recording_id, str):
        return response(400, {"error": "Recording ID must be text"})

    if type(batch_number) is not int:
        return response(400, {"error": "Batch number must be an integer"})

    if not isinstance(readings, list) or len(readings) == 0:
        return response(400, {"error": "Expected a non-empty list of readings"})

    for reading in readings:
        if not isinstance(reading, list):
            return response(400, {"error": "Each reading must be a list"})

        if len(reading) != 8:
            return response(400, {"error": "Each reading needs eight values"})

    filename = f"recordings/{recording_id}/batch-{batch_number:06d}.json"

    s3.put_object(
        Bucket=os.environ["BUCKET_NAME"],
        Key=filename,
        Body=json.dumps(data).encode("utf-8"),
        ContentType="application/json",
    )

    return response(200, {
        "message": "Batch saved",
        "key": filename,
        "readings_saved": len(readings),
    })