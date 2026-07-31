-- Foundation: 4 -> 2, Governance: 2 -> 4 (Context=1 and Stages=3 already correct)
-- ON UPDATE CASCADE on Question.questionTypeId (see 20260728133239_create_question_tables)
-- means every referencing Question row updates automatically.
UPDATE "QuestionType" SET id = 999 WHERE id = 4; -- Foundation -> temp, avoids PK collision
UPDATE "QuestionType" SET id = 4 WHERE id = 2;   -- Governance -> 4
UPDATE "QuestionType" SET id = 2 WHERE id = 999; -- Foundation -> 2

SELECT setval(pg_get_serial_sequence('"QuestionType"', 'id'), (SELECT MAX(id) FROM "QuestionType"));
SELECT setval(pg_get_serial_sequence('"Stage"', 'id'), (SELECT MAX(id) FROM "Stage"));
