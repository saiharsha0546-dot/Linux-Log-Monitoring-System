#!/bin/bash
# SentinelLog Pro - Real-time Log Monitor
# High-performance log tailing and alert dispatching
# --------------------------------------------------

# Configuration
LOG_FILES=("/var/log/syslog" "/var/log/auth.log" "/var/log/apache2/access.log" "/var/log/nginx/access.log")
ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/HERE"
HOSTNAME=$(hostname)

echo "[*] SentinelLog Pro Monitoring Started on $HOSTNAME"
echo "[*] Monitoring: ${LOG_FILES[*]}"

# Ensure we have permissions
for log in "${LOG_FILES[@]}"; do
    if [ ! -r "$log" ]; then
        echo "[!] Warning: Cannot read $log. Run with sudo?"
    fi
done

# Function to dispatch alerts
send_alert() {
    local source=$1
    local message=$2
    local priority=$3

    echo "[!] ALERT [$priority]: $message"
    
    # Example Webhook Dispatch
    # curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"*[$priority] $source on $HOSTNAME:* $message\"}" $ALERT_WEBHOOK
}

# Main monitoring loop using tail -F (follows rotated files)
tail -q -F "${LOG_FILES[@]}" | while read -r line; do
    # 1. Detection: SSH Brute Force
    if echo "$line" | grep -q "Failed password for"; then
        IP=$(echo "$line" | grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" | head -1)
        send_alert "SSH" "Possible Brute Force attempt from $IP" "CRITICAL"
    fi

    # 2. Detection: Unauthorized Sudo
    if echo "$line" | grep -q "user NOT in sudoers"; then
        USER=$(echo "$line" | grep -oP "user=\K\S+")
        send_alert "Sudo" "Unauthorized sudo attempt by user: $USER" "HIGH"
    fi

    # 3. Detection: Disk Space Warning
    if echo "$line" | grep -q "disk space low"; then
        send_alert "System" "Disk space critical on root partition" "WARNING"
    fi

    # 4. Pipeline Execution: Bash -> Python Detection -> Python Remediation (SOAR)
    # This chain allows for real-time detection and automated firewall response
    echo "$line" | python3 scripts/anomaly_detection.py | python3 scripts/remediation_engine.py
done
