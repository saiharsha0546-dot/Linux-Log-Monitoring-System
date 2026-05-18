#!/usr/bin/env python3
"""
SentinelLog Pro - Anomaly Detection Engine
Advanced Regex and Pattern Matching for Linux Logs
"""

import sys
import re
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("sentinel_detect.log"),
        logging.StreamHandler()
    ]
)

# Threat Intelligence Patterns
PATTERNS = {
    "brute_force": r"Failed password for (invalid user )?(\w+) from ([\d\.]+) port \d+ ssh2",
    "suspicious_ip": r"(403|401|444) .* from ([\d\.]+)",
    "kernel_panic": r"Kernel panic - not syncing",
    "segmentation_fault": r"segfault at .* ip .* sp .* error",
    "sudo_violation": r"(\w+) : user NOT in sudoers ; TTY=.* ; PWD=.* ; USER=root ; COMMAND=(.*)",
}

def analyze_line(line):
    """
    Classifies a log line based on predefined threat models.
    """
    for category, pattern in PATTERNS.items():
        match = re.search(pattern, line)
        if match:
            trigger_event(category, match.groups(), line)

def trigger_event(category, details, raw):
    """
    Handles event triage and reporting.
    """
    event = {
        "timestamp": datetime.now().isoformat(),
        "category": category.upper(),
        "details": details,
        "impact": "HIGH" if category in ["kernel_panic", "brute_force"] else "MEDIUM",
        "raw_log": raw.strip()
    }
    
    logging.warning(f"THRESHOLD BREACHED: {category} detected. Details: {details}")
    
    # Output JSON for the Remediation Engine (piped)
    print(json.dumps(event), flush=True)

if __name__ == "__main__":
    logging.info("Advanced Anomaly Detection Engine v1.0 Engaged")
    
    # Read from STDIN (piped from Bash monitor)
    try:
        for line in sys.stdin:
            if line:
                analyze_line(line)
    except KeyboardInterrupt:
        logging.info("Detection engine gracefully disengaged.")
        sys.exit(0)
