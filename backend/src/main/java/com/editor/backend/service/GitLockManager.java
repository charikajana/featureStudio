package com.editor.backend.service;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Ensures that Git operations on the same local repository path are synchronized
 * to prevent 'index.lock' issues, especially on Windows where file locking is strict.
 */
@Component
public class GitLockManager {
    private final ConcurrentHashMap<String, ReentrantLock> repoLocks = new ConcurrentHashMap<>();

    public ReentrantLock getLock(String localPath) {
        return repoLocks.computeIfAbsent(localPath, k -> new ReentrantLock());
    }

    public boolean tryLock(String localPath) {
        return getLock(localPath).tryLock();
    }

    public void lock(String localPath) {
        getLock(localPath).lock();
    }

    public void unlock(String localPath) {
        ReentrantLock lock = repoLocks.get(localPath);
        if (lock != null && lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
