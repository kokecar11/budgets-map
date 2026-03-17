def load_all_models():
    from src.user import models  # noqa
    from src.account import models  # noqa
    from src.category import models  # noqa
    from src.transaction import models  # noqa
    from src.budget import models  # noqa
    from src.credit_card import models  # noqa
    from src.loan import models  # noqa
    from src.saving import models  # noqa
    from src.permissions import models  # noqa
