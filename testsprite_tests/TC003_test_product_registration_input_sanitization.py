import requests

BASE_URL = "http://localhost:3000/api/coupang/register"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_product_registration_input_sanitization():
    # Prepare product data containing harmful HTML tags in the product description
    payload = {
        "productName": "Test Product <script>alert('xss')</script>",
        "wholesalePrice": 10000,
        "price": 15000,
        "platform": "rocket"
    }

    # Send the registration request
    response = requests.post(BASE_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)

    # Assert the product registration succeeded (200 OK expected if sanitization is done)
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}, body: {response.text}"

    # Verify the response does not contain the harmful <script> tag (sanitization)
    response_json = response.json() if response.headers.get("Content-Type", "").startswith("application/json") else {}

    # Check if response contains sanitized productName field (if returned)
    sanitized_name = response_json.get("productName", "")
    assert "<script>" not in sanitized_name and "</script>" not in sanitized_name, \
        "Product name contains unsafe script tags after registration"

    # Additional check: If the API returns some sanitized description or fields,
    # verify those do not contain <script> tags as well, but here only productName is provided in the schema

test_product_registration_input_sanitization()
