#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5007}"
RUN_REAL_INTEGRATIONS="${RUN_REAL_INTEGRATIONS:-0}"
REAL_EMAIL="${REAL_EMAIL:-}"
REAL_CHAT_ID="${REAL_CHAT_ID:-}"

TMP_DIR="$(mktemp -d)"
BODY_FILE="$TMP_DIR/body.json"
PASS_COUNT=0
FAIL_COUNT=0

TEST_USER_EMAIL="testuser.$(date +%s)@gmail.com"
TEST_USER_PASSWORD="Test@1234"
TEST_USER_NAME="TestUser"
SECOND_USER_EMAIL="second.$(date +%s)@gmail.com"
SECOND_USER_PASSWORD="Test@1234"
SECOND_USER_NAME="SecondUser"

AUTH_TOKEN=""
SECOND_USER_TOKEN=""
JOB_ID=""

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

log_pass() {
  echo "✅ PASS: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
  echo "❌ FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

http_call() {
  local method="$1"
  local url="$2"
  local auth_header="${3:-}"
  local json_body="${4:-}"

  if [[ -n "$auth_header" && -n "$json_body" ]]; then
    HTTP_CODE=$(curl -sS -o "$BODY_FILE" -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: $auth_header" \
      -H "Content-Type: application/json" \
      -d "$json_body")
  elif [[ -n "$auth_header" ]]; then
    HTTP_CODE=$(curl -sS -o "$BODY_FILE" -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: $auth_header")
  elif [[ -n "$json_body" ]]; then
    HTTP_CODE=$(curl -sS -o "$BODY_FILE" -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$json_body")
  else
    HTTP_CODE=$(curl -sS -o "$BODY_FILE" -w "%{http_code}" -X "$method" "$url")
  fi
}

json_get() {
  local expression="$1"
  node -e "const fs=require('fs'); const p=process.argv[1]; const expr=process.argv[2]; try { const obj=JSON.parse(fs.readFileSync(p,'utf8')); const val=expr.split('.').reduce((a,k)=>a?.[k],obj); process.stdout.write(val===undefined||val===null?'':String(val)); } catch { process.stdout.write(''); }" "$BODY_FILE" "$expression"
}

assert_status_and_message() {
  local expected_status="$1"
  local expected_msg="$2"
  local test_name="$3"
  local actual_msg
  actual_msg="$(json_get message)"

  if [[ "$HTTP_CODE" == "$expected_status" && "$actual_msg" == "$expected_msg" ]]; then
    log_pass "$test_name"
  else
    echo "   expected status=$expected_status msg='$expected_msg'"
    echo "   actual   status=$HTTP_CODE msg='$actual_msg' body=$(cat "$BODY_FILE")"
    log_fail "$test_name"
  fi
}

assert_status_only() {
  local expected_status="$1"
  local test_name="$2"
  if [[ "$HTTP_CODE" == "$expected_status" ]]; then
    log_pass "$test_name"
  else
    echo "   expected status=$expected_status"
    echo "   actual   status=$HTTP_CODE body=$(cat "$BODY_FILE")"
    log_fail "$test_name"
  fi
}

poll_job_until_terminal() {
  local token="$1"
  local job_id="$2"
  local max_attempts=10
  local attempt=1

  while [[ $attempt -le $max_attempts ]]; do
    sleep 2
    http_call "GET" "$BASE_URL/api/jobs/$job_id" "Bearer $token"
    local status
    status="$(json_get job.status)"
    if [[ "$status" == "COMPLETED" || "$status" == "FAILED" ]]; then
      echo "$status"
      return 0
    fi
    attempt=$((attempt + 1))
  done

  echo "TIMEOUT"
}

echo "Running E2E HTTP tests against: $BASE_URL"
echo

echo "STEP 1 — Health check"
http_call "GET" "$BASE_URL/health"
assert_status_only "200" "Health check"

echo

echo "STEP 2 — Signup validation tests"
http_call "POST" "$BASE_URL/api/auth/signup" "" '{"email":"test@gmail.com","password":"Test@1234"}'
assert_status_and_message "400" "Fill all the fields" "Signup missing fields"

http_call "POST" "$BASE_URL/api/auth/signup" "" '{"name":"Sahil","email":"notanemail","password":"Test@1234"}'
assert_status_and_message "400" "Invalid Email" "Signup invalid email"

http_call "POST" "$BASE_URL/api/auth/signup" "" '{"name":"Sahil","email":"test@gmail.com","password":"abc"}'
assert_status_and_message "400" "Minimum password length is 8 characters" "Signup short password"

http_call "POST" "$BASE_URL/api/auth/signup" "" '{"name":"Sa","email":"test@gmail.com","password":"Test@1234"}'
assert_status_and_message "400" "Name is too short" "Signup short name"

echo

echo "STEP 3 — Valid signup + duplicate"
http_call "POST" "$BASE_URL/api/auth/signup" "" "{\"name\":\"$TEST_USER_NAME\",\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"
assert_status_and_message "201" "Account created" "Signup valid user"

http_call "POST" "$BASE_URL/api/auth/signup" "" "{\"name\":\"$TEST_USER_NAME\",\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"
assert_status_and_message "400" "Email already in use" "Signup duplicate email"

echo

echo "STEP 4 — Login validation tests"
http_call "POST" "$BASE_URL/api/auth/login" "" "{\"email\":\"$TEST_USER_EMAIL\"}"
assert_status_and_message "400" "Fill all the fields" "Login missing fields"

http_call "POST" "$BASE_URL/api/auth/login" "" "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"WrongPass@1\"}"
assert_status_and_message "400" "Invalid Email or Password" "Login wrong password"

http_call "POST" "$BASE_URL/api/auth/login" "" '{"email":"nobody@gmail.com","password":"Test@1234"}'
assert_status_and_message "400" "Invalid Email or Password" "Login non-existent user"

echo

echo "STEP 5 — Valid login"
http_call "POST" "$BASE_URL/api/auth/login" "" "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"
if [[ "$HTTP_CODE" == "200" ]]; then
  AUTH_TOKEN="$(json_get token)"
  USER_ID="$(json_get user.id)"
  USER_ROLE="$(json_get user.role)"
  if [[ -n "$AUTH_TOKEN" && -n "$USER_ID" && -n "$USER_ROLE" ]]; then
    log_pass "Login valid user returns user + token"
  else
    echo "   actual body=$(cat "$BODY_FILE")"
    log_fail "Login valid user returns user + token"
  fi
else
  echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
  log_fail "Login valid user returns user + token"
fi

echo

echo "STEP 6 — Auth middleware tests"
http_call "POST" "$BASE_URL/api/jobs" "" '{"job_type":"SEND_EMAIL","payload":{"to":"test@gmail.com","subject":"Hello","body":"Test"}}'
assert_status_and_message "401" "Authorization header missing" "Jobs no token"

http_call "POST" "$BASE_URL/api/jobs" "Bearer invalidtokenhere" '{"job_type":"SEND_EMAIL","payload":{"to":"test@gmail.com","subject":"Hello","body":"Test"}}'
assert_status_and_message "401" "Invalid or expired token" "Jobs invalid token"

http_call "POST" "$BASE_URL/api/jobs" "invalidtokenhere" '{"job_type":"SEND_EMAIL","payload":{"to":"test@gmail.com","subject":"Hello","body":"Test"}}'
assert_status_and_message "401" "Invalid Token" "Jobs malformed auth header"

echo

echo "STEP 7 — Job validation tests"
http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" '{"job_type":"INVALID_TYPE","payload":{}}'
assert_status_and_message "400" "Invalid Job Type" "Job invalid type"

http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" '{"job_type":"SEND_EMAIL","payload":{"to":"test@gmail.com"}}'
assert_status_and_message "400" "Fill all the fields" "Job SEND_EMAIL missing fields"

http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" '{"job_type":"SEND_EMAIL","payload":{"to":"notanemail","subject":"Hello","body":"Test"}}'
assert_status_and_message "400" "Invalid Email" "Job SEND_EMAIL invalid payload email"

http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" '{"job_type":"SEND_MESSAGE","payload":{"chatId":"123456"}}'
assert_status_and_message "400" "Fill all the fields" "Job SEND_MESSAGE missing fields"

echo

echo "STEP 8 — Valid job submission"
http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" "{\"job_type\":\"SEND_EMAIL\",\"payload\":{\"to\":\"$TEST_USER_EMAIL\",\"subject\":\"Test Email\",\"body\":\"This is a test email from the scheduler\"}}"
if [[ "$HTTP_CODE" == "201" ]]; then
  JOB_ID="$(json_get job.id)"
  INITIAL_STATUS="$(json_get job.status)"
  if [[ -n "$JOB_ID" && "$INITIAL_STATUS" == "PENDING" ]]; then
    log_pass "Valid SEND_EMAIL creates PENDING job"
  else
    echo "   actual body=$(cat "$BODY_FILE")"
    log_fail "Valid SEND_EMAIL creates PENDING job"
  fi
else
  echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
  log_fail "Valid SEND_EMAIL creates PENDING job"
fi

if [[ -n "$JOB_ID" ]]; then
  FINAL_STATUS="$(poll_job_until_terminal "$AUTH_TOKEN" "$JOB_ID")"
  if [[ "$FINAL_STATUS" == "COMPLETED" ]]; then
    log_pass "SEND_EMAIL job reaches COMPLETED"
  else
    echo "   final status=$FINAL_STATUS"
    log_fail "SEND_EMAIL job reaches COMPLETED"
  fi
fi

http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" '{"job_type":"SEND_MESSAGE","payload":{"chatId":"123456","message":"Hello from the scheduler"}}'
if [[ "$HTTP_CODE" == "201" ]]; then
  MSG_JOB_ID="$(json_get job.id)"
  MSG_INITIAL="$(json_get job.status)"
  if [[ -n "$MSG_JOB_ID" && "$MSG_INITIAL" == "PENDING" ]]; then
    log_pass "Valid SEND_MESSAGE creates PENDING job"
  else
    echo "   actual body=$(cat "$BODY_FILE")"
    log_fail "Valid SEND_MESSAGE creates PENDING job"
  fi

  MSG_FINAL="$(poll_job_until_terminal "$AUTH_TOKEN" "$MSG_JOB_ID")"
  if [[ "$MSG_FINAL" == "COMPLETED" ]]; then
    log_pass "SEND_MESSAGE job reaches COMPLETED"
  else
    echo "   final status=$MSG_FINAL"
    log_fail "SEND_MESSAGE job reaches COMPLETED"
  fi
else
  echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
  log_fail "Valid SEND_MESSAGE creates PENDING job"
fi

echo

echo "STEP 9 — Job status endpoint"
if [[ -n "$JOB_ID" ]]; then
  http_call "GET" "$BASE_URL/api/jobs/$JOB_ID" "Bearer $AUTH_TOKEN"
  if [[ "$HTTP_CODE" == "200" ]]; then
    STATUS_VALUE="$(json_get job.status)"
    if [[ -n "$STATUS_VALUE" ]]; then
      log_pass "Get job by id returns job"
    else
      echo "   actual body=$(cat "$BODY_FILE")"
      log_fail "Get job by id returns job"
    fi
  else
    echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
    log_fail "Get job by id returns job"
  fi
fi

http_call "GET" "$BASE_URL/api/jobs/non-existent-id" "Bearer $AUTH_TOKEN"
assert_status_and_message "404" "Job not found" "Get missing job returns 404"

http_call "POST" "$BASE_URL/api/auth/signup" "" "{\"name\":\"$SECOND_USER_NAME\",\"email\":\"$SECOND_USER_EMAIL\",\"password\":\"$SECOND_USER_PASSWORD\"}"
if [[ "$HTTP_CODE" == "201" ]]; then
  log_pass "Second user signup"
else
  echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
  log_fail "Second user signup"
fi

http_call "POST" "$BASE_URL/api/auth/login" "" "{\"email\":\"$SECOND_USER_EMAIL\",\"password\":\"$SECOND_USER_PASSWORD\"}"
if [[ "$HTTP_CODE" == "200" ]]; then
  SECOND_USER_TOKEN="$(json_get token)"
  if [[ -n "$SECOND_USER_TOKEN" ]]; then
    log_pass "Second user login"
  else
    echo "   actual body=$(cat "$BODY_FILE")"
    log_fail "Second user login"
  fi
else
  echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
  log_fail "Second user login"
fi

if [[ -n "$SECOND_USER_TOKEN" && -n "$JOB_ID" ]]; then
  http_call "GET" "$BASE_URL/api/jobs/$JOB_ID" "Bearer $SECOND_USER_TOKEN"
  assert_status_and_message "403" "Forbidden" "Cross-user job access blocked"
fi

echo

echo "STEP 10 — Real email and Telegram tests (optional)"
if [[ "$RUN_REAL_INTEGRATIONS" == "1" && -n "$REAL_EMAIL" && -n "$REAL_CHAT_ID" ]]; then
  http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" "{\"job_type\":\"SEND_EMAIL\",\"payload\":{\"to\":\"$REAL_EMAIL\",\"subject\":\"Test from Scheduler\",\"body\":\"If you receive this the email job is working\"}}"
  if [[ "$HTTP_CODE" == "201" ]]; then
    REAL_EMAIL_JOB_ID="$(json_get job.id)"
    REAL_EMAIL_STATUS="$(poll_job_until_terminal "$AUTH_TOKEN" "$REAL_EMAIL_JOB_ID")"
    if [[ "$REAL_EMAIL_STATUS" == "COMPLETED" ]]; then
      log_pass "Real email job completed"
    else
      echo "   final status=$REAL_EMAIL_STATUS"
      log_fail "Real email job completed"
    fi
  else
    echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
    log_fail "Real email job submit"
  fi

  http_call "POST" "$BASE_URL/api/jobs" "Bearer $AUTH_TOKEN" "{\"job_type\":\"SEND_MESSAGE\",\"payload\":{\"chatId\":\"$REAL_CHAT_ID\",\"message\":\"Hello from the distributed task scheduler\"}}"
  if [[ "$HTTP_CODE" == "201" ]]; then
    REAL_MSG_JOB_ID="$(json_get job.id)"
    REAL_MSG_STATUS="$(poll_job_until_terminal "$AUTH_TOKEN" "$REAL_MSG_JOB_ID")"
    if [[ "$REAL_MSG_STATUS" == "COMPLETED" ]]; then
      log_pass "Real telegram job completed"
    else
      echo "   final status=$REAL_MSG_STATUS"
      log_fail "Real telegram job completed"
    fi
  else
    echo "   actual status=$HTTP_CODE body=$(cat "$BODY_FILE")"
    log_fail "Real telegram job submit"
  fi
else
  echo "ℹ️  Skipped real integrations. Set RUN_REAL_INTEGRATIONS=1 REAL_EMAIL=... REAL_CHAT_ID=..."
fi

echo

echo "STEP 11 — Retry logic test"
echo "ℹ️  Manual step: set wrong RESEND_API_KEY, restart server, submit SEND_EMAIL, and verify RETRYING->FAILED with retry_count=3"

echo

echo "STEP 12 — WebSocket test"
echo "ℹ️  Manual validation recommended using socket.io client. Server supports events: subscribe:job and subscribe {jobId}."

echo

echo "====================================="
echo "E2E Summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
echo "====================================="

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
