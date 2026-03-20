"""
Integration test: Asset tagging journey.
"""


def test_create_and_assign_tag(integration_client, seeded_asset_type, seeded_portfolio):
    """Create tag, assign to asset, verify, then remove."""
    portfolio_id = seeded_portfolio["id"]

    # Create tag
    resp = integration_client.post("/api/v1/tags/", json={"name": "investment"})
    assert resp.status_code == 201
    tag_id = resp.json()["id"]

    resp = integration_client.get("/api/v1/tags/")
    assert resp.status_code == 200
    assert any(tag["id"] == tag_id for tag in resp.json())

    # Create asset
    resp = integration_client.post("/api/v1/assets/", json={
        "portfolio_id": portfolio_id,
        "asset_type_id": str(seeded_asset_type.id),
        "name": "Tagged Asset",
        "created_by": "test_user"
    })
    assert resp.status_code == 201
    asset_id = resp.json()["id"]

    # Assign tag to asset
    resp = integration_client.post(f"/api/v1/assets/{asset_id}/tags/{tag_id}")
    assert resp.status_code == 200

    # Create duplicate tag — should fail with 409
    resp = integration_client.post("/api/v1/tags/", json={"name": "investment"})
    assert resp.status_code == 409
    assert resp.json()["code"] == "DUPLICATE_NAME"

    # Remove tag
    resp = integration_client.delete(f"/api/v1/assets/{asset_id}/tags/{tag_id}")
    assert resp.status_code == 204
