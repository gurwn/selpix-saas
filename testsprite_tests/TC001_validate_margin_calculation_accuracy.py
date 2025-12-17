import requests

BASE_URL = "http://localhost:3000/margin"
TIMEOUT = 30

def test_validate_margin_calculation_accuracy():
    """
    Test the margin calculator with various inputs including wholesale price,
    selling price, and platform selection to ensure the profit margin and net profit
    are calculated accurately according to the specified platform fees.
    
    Platform fees:
        - rocket: 10.8%
        - wing: 6.5%
        - consignment: 8.0%
    """

    test_inputs = [
        # Format: (wholesalePrice, sellingPrice, platform, expected_margin, expected_net_profit)
        # Expected margin and net profit calculated manually for verification

        # Test case 1: Rocket platform
        (100, 150, "rocket"),
        # Test case 2: Wing platform
        (200, 250, "wing"),
        # Test case 3: Consignment platform
        (50, 80, "consignment"),
        # Test case 4: Negative margin (sellingPrice < wholesalePrice)
        (120, 100, "rocket"),
        # Test case 5: Zero wholesale price (should handle gracefully)
        (0, 100, "wing"),
        # Test case 6: Selling price equal to wholesale price
        (100, 100, "consignment")
    ]

    # Platform fee rate mapping
    platform_fees = {
        "rocket": 0.108,
        "wing": 0.065,
        "consignment": 0.08,
    }

    for wholesalePrice, sellingPrice, platform in test_inputs:
        try:
            resp = requests.post(
                BASE_URL,
                json={
                    "wholesalePrice": wholesalePrice,
                    "sellingPrice": sellingPrice,
                    "platform": platform
                },
                timeout=TIMEOUT
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            assert False, f"Request failed: {e}"

        try:
            data = resp.json()
        except Exception as e:
            assert False, f"Response is not valid JSON: {e}"

        # Expect response to have 'marginPercent' and 'netProfit' fields (assumed naming)
        # The PRD does not specify exact response schema, so infer typical output keys
        assert "marginPercent" in data, "Response missing 'marginPercent'"
        assert "netProfit" in data, "Response missing 'netProfit'"

        margin_percent = data["marginPercent"]
        net_profit = data["netProfit"]

        # Calculate expected results based on formula:
        # netProfit = sellingPrice - wholesalePrice - platform_fee
        # platform_fee = sellingPrice * platform_fee_rate
        platform_fee_rate = platform_fees.get(platform)
        expected_net_profit = sellingPrice - wholesalePrice - sellingPrice * platform_fee_rate

        # marginPercent = (netProfit / sellingPrice) * 100 if sellingPrice > 0 else 0
        expected_margin_percent = (expected_net_profit / sellingPrice) * 100 if sellingPrice > 0 else 0

        # Round both to two decimal places for comparison
        margin_percent_rounded = round(margin_percent, 2)
        net_profit_rounded = round(net_profit, 2)
        expected_margin_rounded = round(expected_margin_percent, 2)
        expected_net_profit_rounded = round(expected_net_profit, 2)

        assert margin_percent_rounded == expected_margin_rounded, (
            f"Margin percent mismatch for platform {platform}: expected {expected_margin_rounded}, got {margin_percent_rounded}"
        )
        assert net_profit_rounded == expected_net_profit_rounded, (
            f"Net profit mismatch for platform {platform}: expected {expected_net_profit_rounded}, got {net_profit_rounded}"
        )

test_validate_margin_calculation_accuracy()