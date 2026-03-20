from app.adapters.incoming.api.dependencies import assets as assets_deps


def test_assets_module_exports():
    expected = [
        'get_asset_repository',
        'get_asset_type_repository',
        'get_all_assets_use_case',
        'get_asset_use_case',
        'create_asset_use_case',
        'update_asset_use_case',
        'delete_asset_use_case',
    ]
    for name in expected:
        assert hasattr(assets_deps, name)


def test_get_asset_repository_returns_object():
    repo = assets_deps.get_asset_repository()
    assert repo is not None
