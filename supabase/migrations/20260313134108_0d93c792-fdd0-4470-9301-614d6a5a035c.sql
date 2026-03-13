UPDATE "Lovable" SET drivetrain = TRIM(BOTH '"' FROM drivetrain) WHERE drivetrain LIKE '"%"';
UPDATE "Lovable" SET color = TRIM(BOTH '"' FROM color) WHERE color LIKE '"%"';
UPDATE "Lovable" SET body_type = TRIM(BOTH '"' FROM body_type) WHERE body_type LIKE '"%"';