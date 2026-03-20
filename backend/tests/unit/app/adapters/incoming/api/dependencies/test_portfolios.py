from app.adapters.incoming.api.dependencies import portfolios as portfolios_deps


def test_portfolios_module_exports():
    expected = [
        'get_portfolio_repository',
        'create_portfolio_use_case',
        'get_portfolio_use_case',
        'delete_portfolio_use_case',
        'get_all_portfolios_use_case',
    ]
    for name in expected:
        assert hasattr(portfolios_deps, name)


def test_get_portfolio_repository_returns_object():
    repo = portfolios_deps.get_portfolio_repository()
    assert repo is not None
