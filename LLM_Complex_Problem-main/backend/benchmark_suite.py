"""
benchmark_suite.py
30 problems across 3 tiers, calibrated for Groq free tier API budget.

Each problem has:
  - id, tier, problem: the actual proof statement
  - key_steps: what the proof MUST contain (for manual/LLM judge)
  - sympy_checkable: True = has algebraic steps SymPy can catch errors in
  - expected_difficulty: 'easy' | 'medium' | 'hard'
"""

BENCHMARK = [

    # ── TIER 1: Algebra (10 problems) ────────────────────────────────────────
    {
        "id": "alg_01", "tier": "algebra",
        "problem": "Prove that (a + b)^2 = a^2 + 2ab + b^2 for all real numbers a, b.",
        "key_steps": ["expand (a+b)(a+b)", "collect like terms"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "alg_02", "tier": "algebra",
        "problem": "Prove that (a - b)(a + b) = a^2 - b^2 for all real numbers a, b.",
        "key_steps": ["expand product", "cancel cross terms"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "alg_03", "tier": "algebra",
        "problem": "Prove that the sum of two even integers is even.",
        "key_steps": ["write a=2k, b=2m", "a+b=2(k+m)"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "alg_04", "tier": "algebra",
        "problem": "Prove that the product of two odd integers is odd.",
        "key_steps": ["write a=2k+1, b=2m+1", "product = 2(2km+k+m)+1"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "alg_05", "tier": "algebra",
        "problem": "Prove that for all real a, b: a^2 + b^2 >= 2ab.",
        "key_steps": ["rearrange to (a-b)^2 >= 0"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "alg_06", "tier": "algebra",
        "problem": "Prove that n^2 - n is always even for any integer n.",
        "key_steps": ["factor as n(n-1)", "consecutive integers: one is even"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "alg_07", "tier": "algebra",
        "problem": "Prove that for any integer n, n^3 - n is divisible by 6.",
        "key_steps": ["factor n(n-1)(n+1)", "product of 3 consecutive integers divisible by 2 and 3"],
        "sympy_checkable": False, "expected_difficulty": "medium",
    },
    {
        "id": "alg_08", "tier": "algebra",
        "problem": "Prove that for any real x > 0: x + 1/x >= 2.",
        "key_steps": ["multiply by x", "rearrange to (x-1)^2 >= 0"],
        "sympy_checkable": True, "expected_difficulty": "medium",
    },
    {
        "id": "alg_09", "tier": "algebra",
        "problem": "Prove that for any real numbers a, b, c: a^2 + b^2 + c^2 >= ab + bc + ca.",
        "key_steps": ["multiply by 2", "write as (a-b)^2+(b-c)^2+(c-a)^2 >= 0"],
        "sympy_checkable": True, "expected_difficulty": "medium",
    },
    {
        "id": "alg_10", "tier": "algebra",
        "problem": "Prove by induction that 1 + 2 + 3 + ... + n = n(n+1)/2.",
        "key_steps": ["base case n=1", "inductive step: k(k+1)/2 + (k+1) = (k+1)(k+2)/2"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },

    # ── TIER 2: Number Theory (10 problems) ───────────────────────────────────
    {
        "id": "nt_01", "tier": "number_theory",
        "problem": "Prove that the square root of 2 is irrational.",
        "key_steps": ["assume sqrt(2)=p/q lowest terms", "2q^2=p^2 => p even", "q also even, contradiction"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "nt_02", "tier": "number_theory",
        "problem": "Prove there are infinitely many prime numbers (Euclid's proof).",
        "key_steps": ["assume finite set", "construct N=p1*...*pk+1", "N not divisible by any listed prime"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "nt_03", "tier": "number_theory",
        "problem": "Prove that for any integer n, gcd(n, n+1) = 1.",
        "key_steps": ["d divides n and n+1", "d divides (n+1)-n=1", "so d=1"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "nt_04", "tier": "number_theory",
        "problem": "Prove that every integer greater than 1 has a prime divisor.",
        "key_steps": ["well-ordering: take smallest divisor > 1", "smallest divisor must be prime"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "nt_05", "tier": "number_theory",
        "problem": "Prove by induction that 2^n > n for all positive integers n.",
        "key_steps": ["base n=1", "assume 2^k > k", "2^(k+1)=2*2^k > 2k >= k+1"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "nt_06", "tier": "number_theory",
        "problem": "Prove that log base 2 of 3 is irrational.",
        "key_steps": ["assume log2(3)=p/q", "2^p=3^q", "even=odd contradiction"],
        "sympy_checkable": False, "expected_difficulty": "medium",
    },
    {
        "id": "nt_07", "tier": "number_theory",
        "problem": "Prove that if a prime p divides ab, then p divides a or p divides b.",
        "key_steps": ["gcd(p,a)=1 if p does not divide a", "Bezout: px+ay=1", "multiply by b"],
        "sympy_checkable": False, "expected_difficulty": "medium",
    },
    {
        "id": "nt_08", "tier": "number_theory",
        "problem": "Prove that 3 divides n^3 - n for all integers n.",
        "key_steps": ["factor n(n-1)(n+1)", "three consecutive integers: one divisible by 3"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "nt_09", "tier": "number_theory",
        "problem": "Prove that for integers a, b: gcd(a,b) * lcm(a,b) = |a*b|.",
        "key_steps": ["write a=d*m, b=d*n gcd(m,n)=1", "lcm=d*m*n", "product = d^2*m*n"],
        "sympy_checkable": False, "expected_difficulty": "medium",
    },
    {
        "id": "nt_10", "tier": "number_theory",
        "problem": "Prove that n^5 - n is divisible by 5 for every integer n.",
        "key_steps": ["factor n(n^4-1)", "check all residues mod 5"],
        "sympy_checkable": False, "expected_difficulty": "medium",
    },

    # ── TIER 3: Olympiad (10 problems) ────────────────────────────────────────
    {
        "id": "olym_01", "tier": "olympiad",
        "problem": "Prove the AM-GM inequality: for non-negative reals a, b: (a+b)/2 >= sqrt(ab).",
        "key_steps": ["(sqrt(a)-sqrt(b))^2 >= 0", "expand and rearrange"],
        "sympy_checkable": True, "expected_difficulty": "easy",
    },
    {
        "id": "olym_02", "tier": "olympiad",
        "problem": "Prove that for positive reals a, b, c with a+b+c=1: ab + bc + ca <= 1/3.",
        "key_steps": ["(a+b+c)^2=1", "a^2+b^2+c^2 >= 1/3", "conclude 2(ab+bc+ca) <= 2/3"],
        "sympy_checkable": True, "expected_difficulty": "medium",
    },
    {
        "id": "olym_03", "tier": "olympiad",
        "problem": "Prove that 1^3 + 2^3 + ... + n^3 = (n(n+1)/2)^2 for all positive integers n.",
        "key_steps": ["base case n=1", "inductive step: add (k+1)^3", "algebraic verification"],
        "sympy_checkable": True, "expected_difficulty": "medium",
    },
    {
        "id": "olym_04", "tier": "olympiad",
        "problem": "Prove that for positive reals a, b, c: (a+b)(b+c)(c+a) >= 8abc.",
        "key_steps": ["AM-GM: a+b>=2*sqrt(ab)", "multiply three such inequalities"],
        "sympy_checkable": True, "expected_difficulty": "medium",
    },
    {
        "id": "olym_05", "tier": "olympiad",
        "problem": "Prove the Cauchy-Schwarz inequality: (sum a_i*b_i)^2 <= (sum a_i^2)(sum b_i^2).",
        "key_steps": ["consider f(t)=sum(a_i*t+b_i)^2 >= 0", "discriminant <= 0"],
        "sympy_checkable": False, "expected_difficulty": "hard",
    },
    {
        "id": "olym_06", "tier": "olympiad",
        "problem": "Prove there are no positive integer solutions to x^2 + y^2 = 3z^2.",
        "key_steps": ["mod 4 analysis", "squares are 0 or 1 mod 4", "3z^2 mod 4 is 0 or 3", "contradiction or infinite descent"],
        "sympy_checkable": False, "expected_difficulty": "hard",
    },
    {
        "id": "olym_07", "tier": "olympiad",
        "problem": "Prove that for a prime p and 0 < k < p, p divides C(p, k).",
        "key_steps": ["C(p,k)=p!/(k!(p-k)!)", "p divides numerator", "p does not divide denominator"],
        "sympy_checkable": False, "expected_difficulty": "medium",
    },
    {
        "id": "olym_08", "tier": "olympiad",
        "problem": "Prove that among any 5 integers, there exist 2 whose difference is divisible by 4.",
        "key_steps": ["4 residue classes mod 4", "5 integers in 4 classes", "pigeonhole"],
        "sympy_checkable": False, "expected_difficulty": "easy",
    },
    {
        "id": "olym_09", "tier": "olympiad",
        "problem": "Prove Wilson's theorem: for a prime p, (p-1)! is congruent to -1 (mod p).",
        "key_steps": ["elements of Z_p* pair with their inverses", "only 1 and p-1 are self-inverse", "product of pairs is 1, leaving 1*(p-1)=-1"],
        "sympy_checkable": False, "expected_difficulty": "hard",
    },
    {
        "id": "olym_10", "tier": "olympiad",
        "problem": "Prove that for positive reals x, y, z with xyz=1: x + y + z >= xy + yz + zx.",
        "key_steps": ["AM-GM or SOS approach", "use xyz=1 constraint"],
        "sympy_checkable": True, "expected_difficulty": "hard",
    },
]

TIERS = ["algebra", "number_theory", "olympiad"]

# Filter to 20 questions: 10 algebra, 10 number theory
BENCHMARK = [p for p in BENCHMARK if p["id"] in [f"alg_{i:02d}" for i in range(1, 11)] + [f"nt_{i:02d}" for i in range(1, 11)]]

def get_by_tier(tier: str) -> list:
    return [p for p in BENCHMARK if p["tier"] == tier]

def get_by_id(pid: str) -> dict | None:
    return next((p for p in BENCHMARK if p["id"] == pid), None)

def get_sympy_checkable() -> list:
    return [p for p in BENCHMARK if p["sympy_checkable"]]
