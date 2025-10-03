(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-SUBMITTED (err u101))
(define-constant ERR-INVALID-PROOF (err u102))
(define-constant ERR-SUBMISSION-EXPIRED (err u103))
(define-constant ERR-INVALID-WEIGHT (err u104))
(define-constant ERR-ORACLE-NOT-SET (err u105))
(define-constant ERR-INVALID-SUBMISSION-ID (err u106))
(define-constant ERR-VERIFICATION_FAILED (err u107))
(define-constant ERR-REWARD-ALREADY_CLAIMED (err u108))
(define-constant ERR-INVALID-TIMESTAMP (err u109))
(define-constant ERR-USER-NOT-REGISTERED (err u110))
(define-constant ERR-INVALID-ORACLE (err u111))
(define-constant ERR-MAX-SUBMISSIONS_EXCEEDED (err u112))
(define-constant ERR-INVALID-REWARD-RATE (err u113))
(define-constant ERR-INVALID-STATUS (err u114))
(define-constant ERR-INVALID-LOCATION (err u115))
(define-constant ERR-INVALID-PROOF-TYPE (err u116))
(define-constant ERR-PENDING_VERIFICATION (err u117))
(define-constant ERR-INVALID-CHALLENGE (err u118))
(define-constant ERR-CHALLENGE_EXPIRED (err u119))
(define-constant ERR-INVALID-VOTE (err u120))

(define-data-var oracle-principal principal tx-sender)
(define-data-var submission-timeout uint u144)
(define-data-var max-submissions-per-user uint u10)
(define-data-var reward-rate uint u1)
(define-data-var contract-owner principal tx-sender)
(define-data-var verification-fee uint u50)
(define-data-var challenge-period uint u72)
(define-data-var voting-threshold uint u51)

(define-map Submissions
  { user: principal, submission-id: uint }
  { proof-hash: (buff 32), weight: uint, timestamp: uint, status: uint, proof-type: (string-utf8 20), location: (string-utf8 100) })

(define-map UserSubmissionsCount
  principal
  uint)

(define-map Verifications
  { submission-user: principal, submission-id: uint }
  { verifier: principal, vote: bool, timestamp: uint })

(define-map Challenges
  { submission-user: principal, submission-id: uint }
  { challenger: principal, reason: (string-utf8 200), timestamp: uint, status: bool })

(define-map RewardsClaimed
  { user: principal, submission-id: uint }
  bool)

(define-map UserRegistrations
  principal
  { registered-at: uint, active: bool })

(define-read-only (get-submission (user principal) (id uint))
  (map-get? Submissions { user: user, submission-id: id }))

(define-read-only (get-user-submissions-count (user principal))
  (default-to u0 (map-get? UserSubmissionsCount user)))

(define-read-only (get-verification (sub-user principal) (sub-id uint))
  (map-get? Verifications { submission-user: sub-user, submission-id: sub-id }))

(define-read-only (get-challenge (sub-user principal) (sub-id uint))
  (map-get? Challenges { submission-user: sub-user, submission-id: sub-id }))

(define-read-only (is-reward-claimed (user principal) (id uint))
  (default-to false (map-get? RewardsClaimed { user: user, submission-id: id })))

(define-read-only (is-user-registered (user principal))
  (match (map-get? UserRegistrations user)
    info (get active info)
    false))

(define-private (validate-weight (weight uint))
  (if (and (> weight u0) (<= weight u10000))
    (ok true)
    (err ERR-INVALID-WEIGHT)))

(define-private (validate-proof-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
    (ok true)
    (err ERR-INVALID-PROOF)))

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
    (ok true)
    (err ERR-INVALID-TIMESTAMP)))

(define-private (validate-proof-type (ptype (string-utf8 20)))
  (if (or (is-eq ptype "photo") (is-eq ptype "sensor") (is-eq ptype "manual"))
    (ok true)
    (err ERR-INVALID-PROOF-TYPE)))

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
    (ok true)
    (err ERR-INVALID_LOCATION)))

(define-private (validate-status (status uint))
  (if (<= status u3)
    (ok true)
    (err ERR-INVALID-STATUS)))

(define-private (validate-vote (vote bool))
  (ok true))

(define-private (validate-reasons (reason (string-utf8 200)))
  (if (<= (len reason) u200)
    (ok true)
    (err ERR-INVALID-CHALLENGE)))

(define-public (set-oracle (new-oracle principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set oracle-principal new-oracle)
    (ok true)))

(define-public (set-submission-timeout (new-timeout uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> new-timeout u0) (err ERR-INVALID-TIMESTAMP))
    (var-set submission-timeout new-timeout)
    (ok true)))

(define-public (set-max-submissions (new-max uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> new-max u0) (err ERR-MAX-SUBMISSIONS_EXCEEDED))
    (var-set max-submissions-per-user new-max)
    (ok true)))

(define-public (set-reward-rate (new-rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> new-rate u0) (err ERR-INVALID-REWARD-RATE))
    (var-set reward-rate new-rate)
    (ok true)))

(define-public (set-verification-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= new-fee u0) (err ERR-INVALID_UPDATE-PARAM))
    (var-set verification-fee new-fee)
    (ok true)))

(define-public (set-challenge-period (new-period uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> new-period u0) (err ERR-INVALID_TICKS))
    (var-set challenge-period new-period)
    (ok true)))

(define-public (set-voting-threshold (new-threshold uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (and (> new-threshold u0) (<= new-threshold u100)) (err ERR-INVALID-VOTING-THRESHOLD))
    (var-set voting-threshold new-threshold)
    (ok true)))

(define-public (register-user)
  (begin
    (asserts! (is-none (map-get? UserRegistrations tx-sender)) (err ERR_ALREADY_REGISTERED))
    (map-set UserRegistrations tx-sender { registered-at: block-height, active: true })
    (ok true)))

(define-public (submit-proof (proof-hash (buff 32)) (weight uint) (proof-type (string-utf8 20)) (location (string-utf8 100)))
  (let ((user tx-sender)
        (count (get-user-submissions-count user))
        (sub-id count))
    (asserts! (is-user-registered user) (err ERR-USER-NOT-REGISTERED))
    (asserts! (< count (var-get max-submissions-per-user)) (err ERR-MAX-SUBMISSIONS_EXCEEDED))
    (try! (validate-proof-hash proof-hash))
    (try! (validate-weight weight))
    (try! (validate-proof-type proof-type))
    (try! (validate-location location))
    (map-set Submissions { user: user, submission-id: sub-id }
      { proof-hash: proof-hash, weight: weight, timestamp: block-height, status: u0, proof-type: proof-type, location: location })
    (map-set UserSubmissionsCount user (+ count u1))
    (print { event: "proof-submitted", user: user, id: sub-id })
    (ok sub-id)))

(define-public (verify-submission (sub-user principal) (sub-id uint) (vote bool))
  (let ((sub (get-submission sub-user sub-id))
        (oracle (var-get oracle-principal)))
    (asserts! (is-some sub) (err ERR-INVALID-SUBMISSION-ID))
    (asserts! (is-eq tx-sender oracle) (err ERR-INVALID-ORACLE))
    (try! (validate-vote vote))
    (asserts! (is-none (get-verification sub-user sub-id)) (err ERR_ALREADY_VERIFIED))
    (asserts! (< (get timestamp (unwrap! sub (err ERR_INVALID_SUBMISSION_ID))) (+ block-height (var-get submission-timeout))) (err ERR_SUBMISSION_EXPIRED))
    (try! (stx-transfer? (var-get verification-fee) tx-sender (var-get contract-owner)))
    (map-set Verifications { submission-user: sub-user, submission-id: sub-id }
      { verifier: tx-sender, vote: vote, timestamp: block-height })
    (if vote
      (map-set Submissions { user: sub-user, submission-id: sub-id } (merge (unwrap! sub (err ERR_INVALID_SUBMISSION_ID)) { status: u1 }))
      (map-set Submissions { user: sub-user, submission-id: sub-id } (merge (unwrap! sub (err ERR_INVALID_SUBMISSION_ID)) { status: u2 })))
    (print { event: "submission-verified", user: sub-user, id: sub-id, approved: vote })
    (ok vote)))

(define-public (challenge-submission (sub-user principal) (sub-id uint) (reason (string-utf8 200)))
  (let ((sub (get-submission sub-user sub-id)))
    (asserts! (is-some sub) (err ERR-INVALID-SUBMISSION-ID))
    (asserts! (not (is-eq tx-sender sub-user)) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-none (get-challenge sub-user sub-id)) (err ERR_ALREADY_CHALLENGED))
    (asserts! (< (get timestamp (unwrap! sub (err ERR_INVALID_SUBMISSION_ID))) (+ block-height (var-get challenge-period))) (err ERR_CHALLENGE_EXPIRED))
    (try! (validate-reasons reason))
    (map-set Challenges { submission-user: sub-user, submission-id: sub-id }
      { challenger: tx-sender, reason: reason, timestamp: block-height, status: true })
    (map-set Submissions { user: sub-user, submission-id: sub-id } (merge (unwrap! sub (err ERR_INVALID_SUBMISSION_ID)) { status: u3 }))
    (print { event: "submission-challenged", user: sub-user, id: sub-id })
    (ok true)))

(define-public (resolve-challenge (sub-user principal) (sub-id uint) (resolved-vote bool))
  (let ((chal (get-challenge sub-user sub-id))
        (sub (get-submission sub-user sub-id)))
    (asserts! (is-some chal) (err ERR_INVALID_CHALLENGE))
    (asserts! (is-eq tx-sender (var-get oracle-principal)) (err ERR-INVALID-ORACLE))
    (asserts! (get status (unwrap! chal (err ERR_INVALID_CHALLENGE))) (err ERR_INVALID_STATUS))
    (map-set Challenges { submission-user: sub-user, submission-id: sub-id } (merge (unwrap! chal (err ERR_INVALID_CHALLENGE)) { status: false }))
    (map-set Submissions { user: sub-user, submission-id: sub-id } (merge (unwrap! sub (err ERR_INVALID_SUBMISSION_ID)) { status: (if resolved-vote u1 u2) }))
    (print { event: "challenge-resolved", user: sub-user, id: sub-id, approved: resolved-vote })
    (ok resolved-vote)))

(define-public (claim-reward (sub-id uint))
  (let ((user tx-sender)
        (sub (get-submission user sub-id))
        (weight (get weight (unwrap! sub (err ERR_INVALID_SUBMISSION_ID)))))
    (asserts! (is-some sub) (err ERR_INVALID_SUBMISSION-ID))
    (asserts! (is-eq (get status (unwrap! sub (err ERR_INVALID_SUBMISSION_ID))) u1) (err ERR_VERIFICATION_FAILED))
    (asserts! (not (is-reward-claimed user sub-id)) (err ERR-REWARD-ALREADY_CLAIMED))
    (let ((reward (* weight (var-get reward-rate))))
      (map-set RewardsClaimed { user: user, submission-id: sub-id } true)
      (as-contract (try! (contract-call? .reward-token mint reward user)))
      (print { event: "reward-claimed", user: user, id: sub-id, amount: reward })
      (ok reward))))