package com.riskpilot.graphql;

import com.riskpilot.service.NotFoundException;
import com.riskpilot.service.ValidationException;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

@Component
public class GraphqlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        ErrorType type = ex instanceof NotFoundException ? ErrorType.NOT_FOUND
                : ex instanceof ValidationException ? ErrorType.BAD_REQUEST : null;
        if (type == null) {
            return null;
        }
        return GraphqlErrorBuilder.newError(env).errorType(type).message(ex.getMessage()).build();
    }
}
