#!/usr/bin/env python3
"""
🧹 Cleanup Script - localStorage Tokens Zombies
Script pour nettoyer automatiquement tous les localStorage.getItem('access_token') zombies

Remplace par des appels auth sécurisés via cookies HTTPOnly
"""

import os
import re
import sys
from pathlib import Path

def find_and_replace_in_file(file_path, patterns):
    """Find and replace patterns in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = False
        
        for pattern, replacement in patterns:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                changes_made = True
                print(f"    ✅ Pattern found and replaced: {pattern[:50]}...")
        
        if changes_made:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  📝 Updated: {file_path}")
            return True
        
        return False
    
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {str(e)}")
        return False

def cleanup_localStorage_zombies():
    """Clean up localStorage token zombies across Phoenix apps"""
    
    print("🧹 Starting localStorage Tokens Cleanup")
    print("=" * 50)
    
    # Define base path
    apps_path = Path("/Users/mattvaness/Desktop/IA/phoenix-production/apps")
    
    # Patterns to find and replace
    patterns = [
        # Basic localStorage.getItem('access_token') calls
        (r"localStorage\.getItem\(['\"]access_token['\"]\)", 
         "// 🔐 CLEANED: Was localStorage access_token - now uses HTTPOnly cookies"),
        
        # JWT token decoding patterns
        (r"const\s+token\s*=\s*localStorage\.getItem\(['\"]access_token['\"]\);\s*\n.*?if\s*\(!token\)\s*return.*?null;.*?\n.*?try\s*{.*?\n.*?const\s+payload\s*=\s*JSON\.parse\(atob\(token\.split\('\.'\)\[1\]\)\);.*?\n.*?return\s+payload\.sub;.*?\n.*?}\s*catch.*?{.*?\n.*?return\s+null;.*?\n.*?}", 
         "// 🔐 CLEANED: JWT decoding replaced with secure auth service\n  // Use authService.getUserData() or similar secure method\n  return null; // TODO: Implement proper auth service call"),
        
        # Authorization header patterns with token
        (r"'Authorization':\s*`Bearer\s+\$\{token\}`", 
         "// 🔐 CLEANED: Auth header - use credentials: 'include' instead"),
        
        # Token parameter passing in URLs
        (r"targetUrl\s*=\s*`\$\{.*?\}\?phoenix_token=\$\{encodeURIComponent\(token\)\}`", 
         "// 🔐 CLEANED: Token URL passing - cookies HTTPOnly cross-domain"),
         
        # localStorage removeItem calls
        (r"localStorage\.removeItem\(['\"]access_token['\"]\)", 
         "// 🔐 CLEANED: localStorage.removeItem access_token"),
         
        # localStorage setItem calls  
        (r"localStorage\.setItem\(['\"]access_token['\"], .+?\)", 
         "// 🔐 CLEANED: localStorage.setItem access_token"),
    ]
    
    # File extensions to process
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    
    total_files_processed = 0
    total_files_changed = 0
    
    # Process each app directory
    for app_dir in apps_path.iterdir():
        if app_dir.is_dir() and not app_dir.name.startswith('.'):
            print(f"\n📁 Processing: {app_dir.name}")
            
            # Find all relevant files
            for ext in extensions:
                for file_path in app_dir.rglob(f"*{ext}"):
                    # Skip node_modules and dist directories
                    if 'node_modules' in str(file_path) or 'dist' in str(file_path):
                        continue
                    
                    total_files_processed += 1
                    
                    if find_and_replace_in_file(file_path, patterns):
                        total_files_changed += 1
    
    print("\n" + "=" * 50)
    print("📊 CLEANUP SUMMARY")
    print("=" * 50)
    print(f"📁 Files processed: {total_files_processed}")
    print(f"✅ Files changed: {total_files_changed}")
    print(f"🔐 localStorage zombies cleaned!")
    
    if total_files_changed > 0:
        print("\n⚠️  IMPORTANT:")
        print("1. Review changes before committing")
        print("2. Update TODO comments with proper auth service calls")
        print("3. Test authentication flows")
        print("4. Add 'credentials: include' to fetch calls")
    
    return total_files_changed > 0

def main():
    """Main cleanup function"""
    success = cleanup_localStorage_zombies()
    
    if success:
        print("\n✅ localStorage Cleanup: COMPLETED")
        sys.exit(0)
    else:
        print("\n ℹ️ localStorage Cleanup: NO CHANGES NEEDED")
        sys.exit(0)

if __name__ == "__main__":
    main()