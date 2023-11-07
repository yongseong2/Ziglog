package com.ziglog.ziglog.global.notification.exception.exceptions;

import com.ziglog.ziglog.global.notification.exception.NotificationExceptionCode;

public class AlreadyRemovedNotificationException extends RuntimeException{
    public AlreadyRemovedNotificationException(){
        super(NotificationExceptionCode.ALREADY_REMOVED_NOTIFICATION_EXCEPTION.getErrorMessage());
    }

    public AlreadyRemovedNotificationException(String message){
        super(message);
    }
}
